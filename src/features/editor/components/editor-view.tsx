import Image from 'next/image';

import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFile } from '@/features/projects/hooks/use-files';

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

        {!!activeFile && <CodeEditor fileName={activeFile.name} />}
      </div>
    </div>
  );
};
