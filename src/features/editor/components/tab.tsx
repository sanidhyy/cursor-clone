import { FileIcon } from '@react-symbols/icons/utils';
import { cn } from 'cn';
import { XIcon } from 'lucide-react';

import { useEditor } from '@/features/editor/hooks/use-editor';
import { useFile } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';
import { Spinner } from '@/components/ui/spinner';

interface TabProps {
  fileId: Id<'files'>;
  isFirst: boolean;
  projectId: string;
}

export const Tab = ({ fileId, isFirst, projectId }: TabProps) => {
  const file = useFile(fileId);

  const { activeTabId, previewTabId, setActiveTab, openFile, closeTab } = useEditor(
    projectId as Id<'projects'>
  );

  const isActive = activeTabId === fileId;
  const isPreview = previewTabId === fileId;
  const fileName = file?.name || 'Loading...';

  return (
    <div
      role='button'
      onClick={() => setActiveTab(fileId)}
      onDoubleClick={() => openFile(fileId, { pinned: true })}
      onAuxClick={(e) => {
        if (e.button === 1) closeTab(fileId);
      }}
      className={cn(
        'group flex h-8.75 cursor-pointer items-center gap-2 border border-transparent pr-1.5 pl-2 text-muted-foreground hover:bg-accent/30',
        isActive &&
          '-mb-px border-x-border border-b-background bg-background text-foreground drop-shadow-2xl',
        isFirst && 'border-l-transparent!'
      )}
    >
      {file === undefined ? (
        <Spinner className='text-ring' />
      ) : (
        <FileIcon fileName={fileName} autoAssign className='size-4' />
      )}

      <span className={cn('text-sm whitespace-nowrap', isPreview && 'italic')}>{fileName}</span>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeTab(fileId);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            closeTab(fileId);
          }
        }}
        className={cn(
          'rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/10',
          isActive && 'opacity-100'
        )}
      >
        <XIcon className='size-3.5' />
      </button>
    </div>
  );
};
