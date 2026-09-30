import { useState } from 'react';

import { cn } from 'cn';
import { ChevronRightIcon, CopyMinusIcon, FilePlusCornerIcon, FolderPlusIcon } from 'lucide-react';

import { useProject } from '@/features/projects/hooks/use-projects';
import { FileType } from '@/features/projects/types';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileExplorerProps {
  projectId: string;
}

export const FileExplorer = ({ projectId }: FileExplorerProps) => {
  const project = useProject(projectId);
  const [isOpen, setIsOpen] = useState(false);
  const [collapseKey, setCollapseKey] = useState(0);
  const [creating, setCreating] = useState<FileType | null>(null);

  return (
    <div className='h-full bg-sidebar'>
      <ScrollArea>
        <div
          role='button'
          onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
          className='group/project flex h-5.5 w-full cursor-pointer items-center gap-0.5 bg-accent text-left font-bold'
        >
          <ChevronRightIcon
            className={cn('size-4 shrink-0 text-muted-foreground', isOpen && 'rotate-90')}
          />

          <p className='line-clamp-1 text-xs uppercase'>{project?.name ?? 'Loading...'}</p>

          <div className='ml-auto flex items-center gap-0.5 opacity-0 transition-none duration-0 group-hover/project:opacity-100'>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
              }}
              variant='highlight'
              size='icon-xs'
            >
              <FilePlusCornerIcon className='size-3.5' />
            </Button>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
              }}
              variant='highlight'
              size='icon-xs'
            >
              <FolderPlusIcon className='size-3.5' />
            </Button>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCollapseKey((prevCollapseKey) => prevCollapseKey + 1);
              }}
              variant='highlight'
              size='icon-xs'
            >
              <CopyMinusIcon className='size-3.5' />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
