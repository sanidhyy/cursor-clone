import { useState } from 'react';

import { FileIcon, FolderIcon } from '@react-symbols/icons/utils';
import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';

import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFolderContents,
  useRenameFile,
} from '@/features/projects/hooks/use-files';
import { getItemPadding } from '@/features/projects/lib/utils';
import type { FileType } from '@/features/projects/types';

import type { Doc, Id } from '@/../convex/_generated/dataModel';

import { CreateInput } from './create-input';
import { LoadingRow } from './loading-row';
import { RenameInput } from './rename-input';
import { TreeItemWrapper } from './tree-item-wrapper';

interface TreeProps {
  file: Doc<'files'>;
  level?: number;
  projectId: string;
}

export const Tree = ({ file, level = 0, projectId }: TreeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<FileType | null>(null);

  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();

  const folderContents = useFolderContents({
    projectId: projectId as Id<'projects'>,
    parentId: file._id,
    enabled: file.type === 'folder' && isOpen,
  });

  const startCreating = (type: FileType) => {
    setIsOpen(true);
    setCreating(type);
  };

  const handleCreate = (name: string) => {
    const type = creating;
    setCreating(null);

    if (type === 'file') {
      createFile({
        projectId: projectId as Id<'projects'>,
        name,
        content: '',
        parentId: file._id,
      });
    } else {
      createFolder({
        projectId: projectId as Id<'projects'>,
        name,
        parentId: file._id,
      });
    }
  };

  const handleRename = (newName: string) => {
    setIsRenaming(false);

    if (newName === file.name) return;

    renameFile({ id: file._id, newName });
  };

  if (file.type === 'file') {
    const fileName = file.name;

    if (isRenaming) {
      return (
        <RenameInput
          type='file'
          defaultValue={fileName}
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
      );
    }

    return (
      <TreeItemWrapper
        file={file}
        level={level}
        isActive={false}
        onClick={() => {}}
        onDoubleClick={() => {}}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          deleteFile({ id: file._id });
        }}
      >
        <FileIcon fileName={fileName} autoAssign className='size-4' />
        <span className='truncate text-sm'>{fileName}</span>
      </TreeItemWrapper>
    );
  }

  const folderName = file.name;
  const folderContentRender = (
    <>
      <div className='flex items-center gap-0.5'>
        <ChevronRightIcon
          className={cn('size-4 shrink-0 text-muted-foreground', isOpen && 'rotate-90')}
        />
        <FolderIcon folderName={folderName} className='size-4' />
      </div>

      <span className='truncate text-sm'>{folderName}</span>
    </>
  );

  if (creating) {
    return (
      <>
        <button
          onClick={() => setIsOpen((isOpen) => !isOpen)}
          className='group flex h-5.5 w-full items-center gap-1 hover:bg-accent/30'
          style={{ paddingLeft: getItemPadding(level, false) }}
        >
          {folderContentRender}
        </button>

        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            <CreateInput
              type={creating}
              level={level + 1}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
            {folderContents?.map((subFile) => (
              <Tree key={subFile._id} file={subFile} level={level + 1} projectId={projectId} />
            ))}
          </>
        )}
      </>
    );
  }

  if (isRenaming) {
    return (
      <>
        <RenameInput
          type='folder'
          defaultValue={folderName}
          isOpen={isOpen}
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />

        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            {folderContents?.map((subFile) => (
              <Tree key={subFile._id} file={subFile} level={level + 1} projectId={projectId} />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <TreeItemWrapper
        file={file}
        level={level}
        onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
        onDoubleClick={() => {}}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          deleteFile({ id: file._id });
        }}
        onCreateFile={() => startCreating('file')}
        onCreateFolder={() => startCreating('folder')}
      >
        {folderContentRender}
      </TreeItemWrapper>

      {isOpen && (
        <>
          {folderContents === undefined && <LoadingRow level={level + 1} />}
          {folderContents?.map((subFile) => (
            <Tree key={subFile._id} file={subFile} level={level + 1} projectId={projectId} />
          ))}
        </>
      )}
    </>
  );
};
