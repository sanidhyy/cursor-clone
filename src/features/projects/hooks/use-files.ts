import { useMutation, useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

export const useFile = (fileId: Id<'files'> | null) => {
  return useQuery(api.files.getFile, fileId ? { id: fileId } : 'skip');
};

export const useFilePath = (fileId: Id<'files'> | null) => {
  return useQuery(api.files.getFilePath, fileId ? { id: fileId } : 'skip');
};

export const useCreateFile = () => {
  return useMutation(api.files.createFile);
};

export const useRenameFile = () => {
  return useMutation(api.files.renameFile);
};

export const useDeleteFile = () => {
  return useMutation(api.files.deleteFile);
};

export const useCreateFolder = () => {
  return useMutation(api.files.createFolder);
};

interface UseFolderContentsProps {
  projectId: Id<'projects'>;
  parentId?: Id<'files'>;
  enabled?: boolean;
}

export const useFolderContents = ({ projectId, parentId, enabled }: UseFolderContentsProps) => {
  return useQuery(api.files.getFolderContents, enabled ? { projectId, parentId } : 'skip');
};
