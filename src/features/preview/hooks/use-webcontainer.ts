'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { WebContainer, type WebContainerProcess } from '@webcontainer/api';

import {
  buildFileTree,
  hasRunnableManifest,
  syncFileSystem,
  type PreviewFile,
} from '@/features/preview/lib/utils';
import { useFiles } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';

interface PreviewSession {
  projectId: Id<'projects'>;
  active: boolean;
  started: boolean;
  container: WebContainer | null;
  processes: WebContainerProcess[];
  unsubscribe?: () => void;
  release?: () => void;
  files: PreviewFile[] | null;
  syncQueue: Promise<void>;
}

// WebContainer permits only one live instance. A new session waits for the
// previous session to finish booting and tear down, including cancelled boots.
let bootQueue: Promise<void> = Promise.resolve();

const bootWebContainer = async (session: PreviewSession): Promise<WebContainer | null> => {
  const previous = bootQueue;
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));

  bootQueue = previous.then(() => released);

  await previous;

  if (!session.active) {
    release();

    return null;
  }

  try {
    const container = await WebContainer.boot({ coep: 'credentialless' });

    if (!session.active) {
      container.teardown();
      release();

      return null;
    }

    session.container = container;
    session.release = release;

    return container;
  } catch (error) {
    release();

    throw error;
  }
};

const stopSession = (session: PreviewSession) => {
  if (!session.active) return;

  session.active = false;
  session.unsubscribe?.();

  for (const process of session.processes) process.kill();

  session.container?.teardown();
  session.release?.();
};

interface UseWebContainerProps {
  projectId: Id<'projects'>;
  enabled: boolean;
  ready?: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}

export const useWebContainer = ({
  projectId,
  enabled,
  ready = true,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<
    'idle' | 'booting' | 'installing' | 'starting' | 'running' | 'error'
  >('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState('');
  const sessionRef = useRef<PreviewSession | null>(null);
  const files = useFiles(projectId);

  useEffect(() => {
    if (!enabled) return;

    const session: PreviewSession = {
      projectId,
      active: true,
      started: false,
      container: null,
      processes: [],
      files: null,
      syncQueue: Promise.resolve(),
    };

    sessionRef.current = session;

    void Promise.resolve().then(() => {
      if (!session.active) return;

      setStatus('idle');
      setPreviewUrl(null);
      setError(null);
      setTerminalOutput('');
    });

    return () => {
      stopSession(session);

      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [enabled, projectId, restartKey]);

  useEffect(() => {
    const session = sessionRef.current;

    if (
      !enabled ||
      !ready ||
      !session?.active ||
      session.projectId !== projectId ||
      session.started ||
      !files ||
      files.some((file) => file.projectId !== projectId) ||
      !hasRunnableManifest(files, settings?.devCommand)
    )
      return;

    session.started = true;

    const isCurrent = () => session.active && sessionRef.current === session;
    const fail = (error: unknown) => {
      if (!isCurrent()) return;

      stopSession(session);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setPreviewUrl(null);
      setStatus('error');
    };
    const appendOutput = (data: string) => {
      if (isCurrent()) setTerminalOutput((output) => output + data);
    };
    const pipeOutput = (process: WebContainerProcess) => {
      session.processes.push(process);
      void process.output.pipeTo(new WritableStream({ write: appendOutput })).catch(fail);
    };

    const start = async () => {
      try {
        await Promise.resolve();

        if (!isCurrent()) return;

        setStatus('booting');

        const container = await bootWebContainer(session);

        if (!container || !isCurrent()) return;

        const fileTree = await buildFileTree(files);

        if (!isCurrent()) return;

        await container.mount(fileTree);

        if (!isCurrent()) return;

        session.files = files;

        session.unsubscribe = container.on('server-ready', (_port, url) => {
          if (!isCurrent()) return;

          setPreviewUrl(url);
          setStatus('running');
        });
        setStatus('installing');

        const installCommand = settings?.installCommand || 'npm install';
        const [installBin, ...installArgs] = installCommand.split(' ');

        appendOutput(`$ ${installCommand}\n`);

        const installProcess = await container.spawn(installBin, installArgs);

        if (!isCurrent()) {
          installProcess.kill();

          return;
        }

        pipeOutput(installProcess);

        const installExitCode = await installProcess.exit;

        if (!isCurrent()) return;
        if (installExitCode !== 0)
          throw new Error(`${installCommand} failed with code ${installExitCode}`);

        setStatus('starting');

        const devCommand = settings?.devCommand || 'npm run dev';
        const [devBin, ...devArgs] = devCommand.split(' ');

        appendOutput(`\n$ ${devCommand}\n`);

        const devProcess = await container.spawn(devBin, devArgs);

        if (!isCurrent()) {
          devProcess.kill();

          return;
        }

        pipeOutput(devProcess);

        const devExitCode = await devProcess.exit;

        if (!isCurrent()) return;
        if (devExitCode !== 0) throw new Error(`${devCommand} failed with code ${devExitCode}`);

        throw new Error('The development server stopped. Restart preview to try again.');
      } catch (error) {
        fail(error);
      }
    };

    void start();
  }, [
    enabled,
    files,
    projectId,
    ready,
    restartKey,
    settings?.installCommand,
    settings?.devCommand,
  ]);

  useEffect(() => {
    const session = sessionRef.current;
    const container = session?.container;

    if (!session?.active || !container || !files || status !== 'running') return;

    session.syncQueue = session.syncQueue
      .then(async () => {
        if (!session.active || !session.files) return;

        await syncFileSystem(container.fs, session.files, files);

        if (session.active) session.files = files;
      })
      .catch((error) => {
        if (!session.active || sessionRef.current !== session) return;

        stopSession(session);
        setError(error instanceof Error ? error.message : 'Failed to sync preview files');
        setPreviewUrl(null);
        setStatus('error');
      });
  }, [files, status]);

  const restart = useCallback(() => setRestartKey((key) => key + 1), []);

  return {
    status: enabled ? status : 'idle',
    previewUrl: enabled ? previewUrl : null,
    error: enabled ? error : null,
    restart,
    terminalOutput: enabled ? terminalOutput : '',
  };
};
