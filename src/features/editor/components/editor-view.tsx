import { useEffect } from 'react';
import Image from 'next/image';

import { AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useChatStore } from '@/features/conversations/store/use-chat-store';
import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFileAutosave, useFileSaveStore } from '@/features/editor/hooks/use-file-autosave';
import { useFile, useFilePath, useFiles } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';

import { CodeEditor } from './code-editor';
import { FileBreadcrumbs } from './file-breadcrumbs';
import { TopNavigation } from './top-navigation';

interface EditorViewProps {
  projectId: string;
}

export const EditorView = ({ projectId }: EditorViewProps) => {
  const { activeTabId, openTabs, closeTab } = useEditor(projectId as Id<'projects'>);
  const files = useFiles(projectId as Id<'projects'>);
  const activeFile = useFile(activeTabId);
  const filePath = useFilePath(activeTabId);
  const { queueSave, retry } = useFileAutosave(projectId as Id<'projects'>);
  const saves = useFileSaveStore((state) => state.saves);

  const hasSaveError = [...saves.values()].some(
    (save) => save.draft.projectId === projectId && save.status === 'error'
  );

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  useEffect(() => {
    if (!files) return;

    const fileIds = new Set(files.filter((file) => file.type === 'file').map((file) => file._id));

    for (const { draft } of useFileSaveStore.getState().saves.values()) {
      if (draft.projectId === projectId && !fileIds.has(draft.fileId))
        useFileSaveStore.getState().finish(draft);
    }

    for (const fileId of openTabs) {
      if (!fileIds.has(fileId)) closeTab(fileId);
    }
  }, [files, openTabs, closeTab, projectId]);

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center'>
        <TopNavigation projectId={projectId} />
      </div>

      {activeTabId && <FileBreadcrumbs projectId={projectId} />}

      {hasSaveError && (
        <div
          role='alert'
          className='flex items-center justify-between gap-2 border-b p-2 text-sm text-destructive'
        >
          Some edits couldn’t be saved. Your draft is kept here.
          <Button size='sm' variant='outline' onClick={retry}>
            Retry saving
          </Button>
        </div>
      )}
      <div className='min-h-0 flex-1 bg-background'>
        {activeTabId && activeFile === undefined && <LoadingState label='Loading file...' />}
        {(!activeTabId || activeFile === null) && (
          <div className='flex size-full items-center justify-center'>
            <Image
              src='/logo-alt.svg'
              alt='Polaris Logo'
              width={50}
              height={50}
              className='opacity-25'
            />
          </div>
        )}

        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            initialValue={saves.get(activeFile._id)?.draft.content ?? activeFile.content}
            onAddToChat={(code) => {
              try {
                useChatStore.getState().addContext(projectId as Id<'projects'>, {
                  fileId: activeFile._id,
                  path: filePath?.map((part) => part.name).join('/') || activeFile.name,
                  code,
                });

                document.getElementById(`chat-input-${projectId}`)?.focus();
              } catch (error) {
                toast.error(getErrorMessage(error, 'Unable to add selection to chat'));
              }
            }}
            onChange={(content) => queueSave(activeFile._id, content)}
          />
        )}

        {isActiveFileBinary && (
          <div className='flex size-full items-center justify-center'>
            <div className='flex max-w-md flex-col items-center gap-2.5 text-center'>
              <AlertTriangleIcon className='size-10 text-yellow-500' />
              <p className='text-sm'>
                Unable to display file because it&apos;s either binary or uses an unsupported text
                encoding.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
