import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import { Doc, Id } from '@/../convex/_generated/dataModel';

export const useProject = (projectId: string) => {
  return useQuery(api.projects.getById, { id: projectId as Id<'projects'> });
};

export const useProjects = (limit?: number) => {
  return useQuery(api.projects.get, { limit });
};

export const useCreateProject = () => {
  const { userId } = useAuth();

  return useMutation(api.projects.create).withOptimisticUpdate((localStore, { name }) => {
    const existingProjects = localStore.getQuery(api.projects.get, {});
    if (!!existingProjects && !!userId) {
      // eslint-disable-next-line react-hooks/purity -- Optimistic update callbacks access external state
      const now = Date.now();
      const newProject: Doc<'projects'> = {
        _id: crypto.randomUUID() as Id<'projects'>,
        _creationTime: now,
        name,
        ownerId: userId,
        updatedAt: now,
      };

      localStore.setQuery(api.projects.get, {}, [newProject, ...existingProjects]);
    }
  });
};
