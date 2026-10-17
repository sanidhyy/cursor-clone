import { useMutation, useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Doc, Id } from '@/../convex/_generated/dataModel';

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

export const useCreateFile = () => {
  return useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, { projectId, parentId, name, content }) => {
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });

      if (!!existingFiles?.length) {
        // eslint-disable-next-line react-hooks/purity -- Optimistic update callbacks access external state
        const now = Date.now();

        const newFile: Doc<'files'> = {
          _id: crypto.randomUUID() as Id<'files'>,
          _creationTime: now,
          projectId,
          parentId,
          name,
          type: 'file',
          content,
          updatedAt: now,
        };

        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId },
          sortFiles([...existingFiles, newFile])
        );
      }
    }
  );
};

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

interface UseDeleteFileProps {
  projectId: Id<'projects'>;
  parentId?: Id<'files'>;
}

export const useDeleteFile = ({ projectId, parentId }: UseDeleteFileProps) => {
  return useMutation(api.files.deleteFile).withOptimisticUpdate((localStore, { id: fileId }) => {
    const existingFiles = localStore.getQuery(api.files.getFolderContents, {
      projectId,
      parentId,
    });

    if (!!existingFiles?.length) {
      localStore.setQuery(
        api.files.getFolderContents,
        {
          projectId,
          parentId,
        },
        existingFiles.filter((file) => file._id !== fileId)
      );
    }
  });
};

export const useCreateFolder = () => {
  return useMutation(api.files.createFolder).withOptimisticUpdate(
    (localStore, { projectId, parentId, name }) => {
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });

      if (!!existingFiles?.length) {
        // eslint-disable-next-line react-hooks/purity -- Optimistic update callbacks access external state
        const now = Date.now();

        const newFolder: Doc<'files'> = {
          _id: crypto.randomUUID() as Id<'files'>,
          _creationTime: now,
          projectId,
          parentId,
          name,
          type: 'folder',
          updatedAt: now,
        };

        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId },
          sortFiles([...existingFiles, newFolder])
        );
      }
    }
  );
};

interface UseFolderContentsProps {
  projectId: Id<'projects'>;
  parentId?: Id<'files'>;
  enabled?: boolean;
}

export const useFolderContents = ({ projectId, parentId, enabled }: UseFolderContentsProps) => {
  return useQuery(api.files.getFolderContents, enabled ? { projectId, parentId } : 'skip');
};
