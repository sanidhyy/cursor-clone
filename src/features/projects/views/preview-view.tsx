'use client';

import { useState } from 'react';

import { Allotment } from 'allotment';
import { AlertTriangleIcon, RefreshCwIcon, TerminalSquareIcon } from 'lucide-react';

import { useIsProjectProcessing } from '@/features/conversations/hooks/use-conversations';
import { PreviewSettingsPopover } from '@/features/preview/components/preview-settings-popover';
import { PreviewTerminal } from '@/features/preview/components/preview-terminal';
import { useWebContainer } from '@/features/preview/hooks/use-webcontainer';
import {
  DEFAULT_TERMINAL_WIDTH,
  MAX_TERMINAL_WIDTH,
  MIN_TERMINAL_WIDTH,
} from '@/features/projects/constants';
import { useProject } from '@/features/projects/hooks/use-projects';

import type { Id } from '@/../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface PreviewViewProps {
  projectId: string;
}

export const PreviewView = ({ projectId }: PreviewViewProps) => {
  const project = useProject(projectId as Id<'projects'>);
  const isProcessing = useIsProjectProcessing(projectId as Id<'projects'>);
  const [showTerminal, setShowTerminal] = useState(false);

  const { status, previewUrl, error, restart, terminalOutput } = useWebContainer({
    projectId: projectId as Id<'projects'>,
    enabled: true,
    ready:
      !!project &&
      isProcessing === false &&
      project.importStatus !== 'importing' &&
      project.importStatus !== 'failed',
    settings: project?.settings,
  });

  const isLoading = status === 'booting' || status === 'installing';
  const waitingMessage =
    !project || isProcessing === undefined
      ? 'Loading project...'
      : project.importStatus === 'importing'
        ? 'Waiting for import to finish...'
        : project.importStatus === 'failed'
          ? 'Import failed. Complete the import before starting preview.'
          : isProcessing
            ? 'Waiting for AI changes to finish...'
            : 'Waiting for a valid package.json with a dev script or a custom start command.';

  return (
    <div className='flex h-full flex-col bg-background'>
      <div className='flex h-8.75 shrink-0 items-center border-b bg-sidebar'>
        <Button
          size='sm'
          variant='ghost'
          className='h-full rounded-none'
          disabled={isLoading}
          onClick={restart}
          title='Restart container'
        >
          <RefreshCwIcon className='size-3' />
        </Button>

        <div className='flex h-full flex-1 items-center truncate border-x bg-background px-3 font-mono text-xs text-muted-foreground'>
          {isLoading && (
            <div className='flex items-center gap-1.5'>
              <Spinner className='size-3' />
              {status === 'booting' ? 'Starting...' : 'Installing...'}
            </div>
          )}

          {!!previewUrl && <span className='truncate'>{previewUrl}</span>}
          {status === 'idle' && <span>{waitingMessage}</span>}
        </div>

        <Button
          size='sm'
          variant='ghost'
          className='h-full rounded-none'
          onClick={() => setShowTerminal((prevShowTerminal) => !prevShowTerminal)}
          title='Toggle terminal'
        >
          <TerminalSquareIcon className='size-3' />
        </Button>

        <PreviewSettingsPopover
          projectId={projectId as Id<'projects'>}
          initialValues={project?.settings}
          onSave={restart}
        />
      </div>

      <div className='min-h-0 flex-1'>
        <Allotment vertical>
          <Allotment.Pane>
            {status === 'idle' && (
              <div className='flex size-full items-center justify-center p-6 text-center text-sm text-muted-foreground'>
                {waitingMessage}
              </div>
            )}
            {error && (
              <div className='flex size-full items-center justify-center text-muted-foreground'>
                <div className='mx-auto flex max-w-md flex-col items-center gap-2 text-center'>
                  <AlertTriangleIcon className='size-6' />
                  <p className='text-sm font-medium'>{error}</p>

                  <Button size='sm' variant='outline' onClick={restart}>
                    <RefreshCwIcon className='size-4' />
                    Restart
                  </Button>
                </div>
              </div>
            )}

            {isLoading && !error && (
              <div className='flex size-full items-center justify-center text-muted-foreground'>
                <div className='mx-auto flex max-w-md flex-col items-center gap-2 text-center'>
                  <Spinner className='size-6' />
                  <p className='text-sm font-medium'>Installing...</p>
                </div>
              </div>
            )}

            {previewUrl && (
              <iframe src={previewUrl} className='size-full border-0' title='Preview' />
            )}
          </Allotment.Pane>

          {showTerminal && (
            <Allotment.Pane
              minSize={MIN_TERMINAL_WIDTH}
              maxSize={MAX_TERMINAL_WIDTH}
              preferredSize={DEFAULT_TERMINAL_WIDTH}
            >
              <div className='flex h-full flex-col border-t bg-background'>
                <div className='flex h-7 shrink-0 items-center gap-1.5 border-b border-border/50 px-3 text-xs text-muted-foreground'>
                  <TerminalSquareIcon className='size-3' />
                  Terminal
                </div>

                <PreviewTerminal output={terminalOutput} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>
    </div>
  );
};
