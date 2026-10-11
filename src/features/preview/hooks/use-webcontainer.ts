'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { WebContainer } from '@webcontainer/api';

import { buildFileTree, getFilePath } from '@/features/preview/lib/utils';
import { useFiles } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;
  if (!bootPromise) bootPromise = WebContainer.boot();

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

        const fileTree = buildFileTree(files);
        await container.mount(fileTree);

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

    const filesMap = new Map(files.map((file) => [file._id, file]));

    for (const file of files) {
      {
        if (file.type !== 'file' || !!file.storageId || !file.content) continue;

        const filePath = getFilePath(file, filesMap);
        container.fs.writeFile(filePath, file.content);
      }
    }
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
