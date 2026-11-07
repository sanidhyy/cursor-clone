import { useMutation, useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

// sort: folders first, then files, alphabetically within each group
const sortFiles = <T extends { type: 'file' | 'folder'; name: string }>(files: T[]) => {
  return [...files].sort((a, b) => {
    // folders come before files
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

    // within same type, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

export const useFiles = (projectId: Id<'projects'>) => {
  return useQuery(api.files.getFiles, { projectId });
};

export const useFile = (fileId: Id<'files'> | null) => {
  return useQuery(api.files.getFile, fileId ? { id: fileId } : 'skip');
};

export const useFilePath = (fileId: Id<'files'> | null) => {
  return useQuery(api.files.getFilePath, fileId ? { id: fileId } : 'skip');
};

export const useCreateFile = () => useMutation(api.files.createFile);

export const useUpdateFile = () => {
  return useMutation(api.files.updateFile);
};

interface UseRenameFileProps {
  projectId: Id<'projects'>;
  parentId?: Id<'files'>;
}

export const useRenameFile = ({ projectId, parentId }: UseRenameFileProps) => {
  return useMutation(api.files.renameFile).withOptimisticUpdate(
    (localStore, { id: fileId, newName }) => {
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });

      if (!!existingFiles?.length) {
        const updatedFiles = existingFiles.map((file) =>
          file._id === fileId ? { ...file, name: newName } : file
        );

        localStore.setQuery(
          api.files.getFolderContents,
          {
            projectId,
            parentId,
          },
          sortFiles(updatedFiles)
        );
      }
    }
  );
};

export const useDeleteFile = () => {
  return useMutation(api.files.deleteFile);
};

export const useCreateFolder = () => useMutation(api.files.createFolder);

interface UseFolderContentsProps {
  projectId: Id<'projects'>;
  parentId?: Id<'files'>;
  enabled?: boolean;
}

export const useFolderContents = ({ projectId, parentId, enabled }: UseFolderContentsProps) => {
  return useQuery(api.files.getFolderContents, enabled ? { projectId, parentId } : 'skip');
};
