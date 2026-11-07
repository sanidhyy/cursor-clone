'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { WebContainer } from '@webcontainer/api';

import { buildFileTree, syncFileSystem, type PreviewFile } from '@/features/preview/lib/utils';
import { useFiles } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;
  if (!bootPromise)
    bootPromise = WebContainer.boot({
      coep: 'credentialless',
    });

  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
};

const teardownWebContainer = () => {
  if (webcontainerInstance) {
    webcontainerInstance.teardown();
    webcontainerInstance = null;
  }

  bootPromise = null;
};

interface UseWebContainerProps {
  projectId: Id<'projects'>;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}

export const useWebContainer = ({ projectId, enabled, settings }: UseWebContainerProps) => {
  const [status, setStatus] = useState<'idle' | 'booting' | 'installing' | 'running' | 'error'>(
    'idle'
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState('');

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);
  const mountedFilesRef = useRef<PreviewFile[] | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const files = useFiles(projectId);

  useEffect(() => {
    if (!enabled || !files || !files.length || !!hasStartedRef.current) return;

    hasStartedRef.current = true;

    const start = async () => {
      try {
        setError(null);
        setTerminalOutput('');
        setStatus('booting');

        const appendOutput = (data: string) =>
          setTerminalOutput((prevTerminalOutput) => prevTerminalOutput + data);

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = await buildFileTree(files);
        await container.mount(fileTree);
        mountedFilesRef.current = files;

        container.on('server-ready', (_port, url) => {
          setPreviewUrl(url);
          setStatus('running');
        });

        setStatus('installing');

        const installCommand = settings?.installCommand || 'npm install';
        const [installBin, ...installArgs] = installCommand.split(' ');
        appendOutput(`$ ${installCommand}\n`);

        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => appendOutput(data),
          })
        );

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0)
          throw new Error(`${installCommand} failed with code ${installExitCode}`);

        const devCommand = settings?.devCommand || 'npm run dev';
        const [devBin, ...devArgs] = devCommand.split(' ');
        appendOutput(`\n$ ${devCommand}\n`);

        const devProcess = await container.spawn(devBin, devArgs);
        devProcess.output.pipeTo(
          new WritableStream({
            write: (data) => appendOutput(data),
          })
        );

        const devExitCode = await devProcess.exit;

        if (devExitCode !== 0) throw new Error(`${devCommand} failed with code ${installExitCode}`);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    };

    start();
  }, [enabled, files, restartKey, settings?.installCommand, settings?.devCommand]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== 'running') return;

    syncQueueRef.current = syncQueueRef.current
      .then(async () => {
        const previousFiles = mountedFilesRef.current;
        if (containerRef.current !== container || !previousFiles) return;
        await syncFileSystem(container.fs, previousFiles, files);
        if (containerRef.current === container) mountedFilesRef.current = files;
      })
      .catch((error) => {
        if (containerRef.current !== container) return;
        mountedFilesRef.current = null;
        setError(error instanceof Error ? error.message : 'Failed to sync preview files');
        setPreviewUrl(null);
        setStatus('error');
      });
  }, [files, status]);

  useEffect(() => {
    const disableContainer = () => {
      if (!enabled) {
        hasStartedRef.current = false;
        setStatus('idle');
        setPreviewUrl(null);
        setError(null);
      }
    };

    disableContainer();
  }, [enabled]);

  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    mountedFilesRef.current = null;
    syncQueueRef.current = Promise.resolve();
    hasStartedRef.current = false;
    setStatus('idle');
    setPreviewUrl(null);
    setError(null);
    setRestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};
