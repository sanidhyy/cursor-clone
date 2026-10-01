import { useEffect, useRef } from 'react';
import Image from 'next/image';

import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFile, useUpdateFile } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';

import { CodeEditor } from './code-editor';
import { FileBreadcrumbs } from './file-breadcrumbs';
import { TopNavigation } from './top-navigation';

interface EditorViewProps {
  projectId: string;
}

export const EditorView = ({ projectId }: EditorViewProps) => {
  const { activeTabId } = useEditor(projectId as Id<'projects'>);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

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
            onChange={(content: string) => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);

              timeoutRef.current = setTimeout(
                () => updateFile({ id: activeFile._id, content }),
                1500
              );
            }}
          />
        )}

        {isActiveFileBinary && <p>Binary Preview</p>}
      </div>
    </div>
  );
};
