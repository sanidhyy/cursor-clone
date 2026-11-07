import { useEffect, useRef } from 'react';
import Image from 'next/image';

import { AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useChatStore } from '@/features/conversations/store/use-chat-store';
import { DEBOUNCE_MS } from '@/features/editor/constants';
import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFile, useFilePath, useFiles, useUpdateFile } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';

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
  const updateFile = useUpdateFile();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  useEffect(() => {
    if (!files) return;

    const fileIds = new Set(files.filter((file) => file.type === 'file').map((file) => file._id));
    for (const fileId of openTabs) {
      if (!fileIds.has(fileId)) closeTab(fileId);
    }
  }, [files, openTabs, closeTab]);

  // cleanup pending debounced updates
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [activeTabId]
  );

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center'>
        <TopNavigation projectId={projectId} />
      </div>

      {activeTabId && <FileBreadcrumbs projectId={projectId} />}

      <div className='min-h-0 flex-1 bg-background'>
        {!activeFile && (
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
            initialValue={activeFile.content}
            onAddToChat={(code) => {
              try {
                useChatStore.getState().addContext(projectId as Id<'projects'>, {
                  fileId: activeFile._id,
                  path: filePath?.map((part) => part.name).join('/') || activeFile.name,
                  code,
                });
                document.getElementById(`chat-input-${projectId}`)?.focus();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : 'Unable to add selection to chat'
                );
              }
            }}
            onChange={(content: string) => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);

              timeoutRef.current = setTimeout(
                () => updateFile({ id: activeFile._id, content }),
                DEBOUNCE_MS
              );
            }}
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
