import { useState } from 'react';

import { FileIcon, FolderIcon } from '@react-symbols/icons/utils';
import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';

import { useEditor } from '@/features/editor/hooks/use-editor';
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
import { useAsyncAction } from '@/hooks/use-async-action';

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

  const { isPending: isDeleting, run: runDelete } = useAsyncAction(
    'Unable to delete file or folder'
  );
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const renameFile = useRenameFile({
    projectId: projectId as Id<'projects'>,
    parentId: file.parentId,
  });
  const deleteFile = useDeleteFile();

  const { openFile, closeTab, activeTabId } = useEditor(projectId as Id<'projects'>);

  const folderContents = useFolderContents({
    projectId: projectId as Id<'projects'>,
    parentId: file._id,
    enabled: file.type === 'folder' && isOpen,
  });

  const startCreating = (type: FileType) => {
    setIsOpen(true);
    setCreating(type);
  };

  const handleCreate = async (name: string) => {
    const type = creating;
    if (!type) return;

    if (type === 'file') {
      await createFile({
        projectId: projectId as Id<'projects'>,
        name,
        content: '',
        parentId: file._id,
      });
    } else {
      await createFolder({
        projectId: projectId as Id<'projects'>,
        name,
        parentId: file._id,
      });
    }
    setCreating(null);
  };

  const handleRename = async (newName: string) => {
    if (newName !== file.name) await renameFile({ id: file._id, newName });
    setIsRenaming(false);
  };

  const handleDelete = () => {
    void runDelete(async () => {
      await deleteFile({ id: file._id });
      closeTab(file._id);
    });
  };

  if (file.type === 'file') {
    const fileName = file.name;
    const isActive = activeTabId === file._id;

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
        isActive={isActive}
        onClick={() => openFile(file._id, { pinned: false })}
        onDoubleClick={() => openFile(file._id, { pinned: true })}
        onRename={() => setIsRenaming(true)}
        isPending={isDeleting}
        onDelete={handleDelete}
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
        isPending={isDeleting}
        onDelete={handleDelete}
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
