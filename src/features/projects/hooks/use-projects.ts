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

  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, { name: projectName }) => {
      // eslint-disable-next-line react-hooks/purity -- Optimistic update callbacks access external state
      const now = Date.now();
      const existingProjects = localStore.getQuery(api.projects.get, {});

      if (!!existingProjects && !!userId) {
        const newProject: Doc<'projects'> = {
          _id: crypto.randomUUID() as Id<'projects'>,
          _creationTime: now,
          name: projectName,
          ownerId: userId,
          updatedAt: now,
        };

        localStore.setQuery(api.projects.get, {}, [newProject, ...existingProjects]);
      }
    }
  );
};

export const useRenameProject = () => {
  const { userId } = useAuth();

  return useMutation(api.projects.rename).withOptimisticUpdate(
    (localStore, { id: projectId, name: projectName }) => {
      // eslint-disable-next-line react-hooks/purity -- Optimistic update callbacks access external state
      const now = Date.now();
      const existingProject = localStore.getQuery(api.projects.getById, {
        id: projectId as Id<'projects'>,
      });

      if (!!existingProject && !!userId) {
        localStore.setQuery(
          api.projects.getById,
          { id: projectId },
          { ...existingProject, name: projectName, updatedAt: now }
        );
      }

      const existingProjects = localStore.getQuery(api.projects.get, {});
      if (!!existingProjects && !!userId) {
        localStore.setQuery(
          api.projects.get,
          {},
          existingProjects.map((project) => {
            return project._id === projectId
              ? { ...project, name: projectName, updatedAt: now }
              : project;
          })
        );
      }
    }
  );
};
