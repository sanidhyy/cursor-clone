import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';

import { useChatStore } from '@/features/conversations/store/use-chat-store';
import { useFileSaveStore } from '@/features/editor/hooks/use-file-autosave';
import { useEditorStore } from '@/features/editor/store/use-editor-store';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

export const useDeleteProject = () => {
  const remove = useMutation(api.projects.remove);

  return async (id: Id<'projects'>) => {
    await remove({ id });
    useChatStore.setState((state) => {
      const drafts = new Map(state.drafts);
      drafts.delete(id);
      return { drafts };
    });
    useEditorStore.setState((state) => {
      const tabs = new Map(state.tabs);
      tabs.delete(id);
      return { tabs };
    });
    useFileSaveStore.setState((state) => ({
      saves: new Map([...state.saves].filter(([, save]) => save.draft.projectId !== id)),
    }));
  };
};

export const useProject = (projectId: string) => {
  return useQuery(api.projects.getById, { id: projectId as Id<'projects'> });
};

export const useProjects = (limit?: number) => {
  return useQuery(api.projects.get, { limit });
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

export const useUpdateProjectSettings = () => {
  return useMutation(api.projects.updateSettings);
};
