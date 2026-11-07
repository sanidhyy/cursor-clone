import { useState } from 'react';

import { cn } from 'cn';
import { ChevronRightIcon, CopyMinusIcon, FilePlusCornerIcon, FolderPlusIcon } from 'lucide-react';

import {
  useCreateFile,
  useCreateFolder,
  useFolderContents,
} from '@/features/projects/hooks/use-files';
import { useProject } from '@/features/projects/hooks/use-projects';
import type { FileType } from '@/features/projects/types';

import type { Id } from '@/../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CreateInput } from './create-input';
import { LoadingRow } from './loading-row';
import { Tree } from './tree';

interface FileExplorerProps {
  projectId: string;
}

export const FileExplorer = ({ projectId }: FileExplorerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [collapseKey, setCollapseKey] = useState(0);
  const [creating, setCreating] = useState<FileType | null>(null);

  const project = useProject(projectId);
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const rootFiles = useFolderContents({
    projectId: projectId as Id<'projects'>,
    enabled: isOpen,
  });

  const handleCreate = async (name: string) => {
    const type = creating;
    if (!type) return;

    if (type === 'file') {
      await createFile({
        projectId: projectId as Id<'projects'>,
        name,
        content: '',
        parentId: undefined,
      });
    } else {
      await createFolder({
        projectId: projectId as Id<'projects'>,
        name,
        parentId: undefined,
      });
    }
    setCreating(null);
  };

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

          <p className='line-clamp-1 text-xs uppercase'>{project?.name || 'Loading...'}</p>

          <div className='ml-auto flex items-center gap-0.5 opacity-100 transition-none duration-0 group-hover/project:opacity-100 md:opacity-0'>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
                setCreating('file');
              }}
              variant='highlight'
              size='icon-xs'
              disabled={!!creating || rootFiles === undefined}
              title='New File...'
            >
              <FilePlusCornerIcon className='size-3.5' />
            </Button>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
                setCreating('folder');
              }}
              variant='highlight'
              size='icon-xs'
              disabled={!!creating || rootFiles === undefined}
              title='New Folder...'
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
              disabled={!!creating}
              title='Collapse Folders in Explorer'
            >
              <CopyMinusIcon className='size-3.5' />
            </Button>
          </div>
        </div>

        {isOpen && (
          <>
            {rootFiles === undefined && <LoadingRow level={0} />}

            {creating && (
              <CreateInput
                type={creating}
                level={0}
                onSubmit={handleCreate}
                onCancel={() => setCreating(null)}
              />
            )}

            {rootFiles?.map((file) => (
              <Tree
                key={`${file._id}-${collapseKey}`}
                file={file}
                level={0}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </ScrollArea>
    </div>
  );
};
