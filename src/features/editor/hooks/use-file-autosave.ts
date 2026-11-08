import { useCallback, useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { create } from 'zustand';

import { DEBOUNCE_MS } from '@/features/editor/constants';
import { useUpdateFile } from '@/features/projects/hooks/use-files';

import type { Id } from '@/../convex/_generated/dataModel';
import { getErrorMessage } from '@/lib/errors';

interface Draft {
  fileId: Id<'files'>;
  projectId: Id<'projects'>;
  content: string;
}

interface Save {
  draft: Draft;
  status: 'pending' | 'saving' | 'error';
}

interface SaveStore {
  saves: Map<Id<'files'>, Save>;
  setDraft: (draft: Draft) => void;
  finish: (draft: Draft, status?: Save['status']) => void;
}

export const useFileSaveStore = create<SaveStore>()((set, get) => ({
  saves: new Map(),

  setDraft: (draft) => {
    const saves = new Map(get().saves);

    saves.set(draft.fileId, { draft, status: 'pending' });
    set({ saves });
  },

  finish: (draft, status) => {
    if (get().saves.get(draft.fileId)?.draft !== draft) return;

    const saves = new Map(get().saves);

    if (status) saves.set(draft.fileId, { draft, status });
    else saves.delete(draft.fileId);

    set({ saves });
  },
}));

const writes = new Map<Id<'files'>, Promise<void>>();

export const useFileAutosave = (projectId: Id<'projects'>) => {
  const updateFile = useUpdateFile();
  const timers = useRef(new Map<Id<'files'>, ReturnType<typeof setTimeout>>());

  const save = useCallback(
    (draft: Draft) => {
      const task = (writes.get(draft.fileId) ?? Promise.resolve()).then(async () => {
        const store = useFileSaveStore.getState();

        if (store.saves.get(draft.fileId)?.draft !== draft) return;

        store.finish(draft, 'saving');

        try {
          await updateFile({ id: draft.fileId, content: draft.content });

          store.finish(draft);
        } catch (error) {
          if (useFileSaveStore.getState().saves.get(draft.fileId)?.draft !== draft) return;

          store.finish(draft, 'error');

          toast.error(
            getErrorMessage(error, 'Unable to save edits. Your draft is kept here; retry saving.')
          );
        }
      });

      writes.set(draft.fileId, task);

      void task.finally(() => {
        if (writes.get(draft.fileId) === task) writes.delete(draft.fileId);
      });
    },
    [updateFile]
  );

  const queueSave = useCallback(
    (fileId: Id<'files'>, content: string) => {
      const draft = { fileId, projectId, content };

      useFileSaveStore.getState().setDraft(draft);
      clearTimeout(timers.current.get(fileId));

      timers.current.set(
        fileId,
        setTimeout(() => {
          timers.current.delete(fileId);
          save(draft);
        }, DEBOUNCE_MS)
      );
    },
    [projectId, save]
  );

  const retry = () => {
    for (const { draft, status } of useFileSaveStore.getState().saves.values()) {
      if (draft.projectId === projectId && status === 'error') save(draft);
    }
  };

  useEffect(() => {
    const pendingTimers = timers.current;

    return () => {
      for (const [fileId, timer] of pendingTimers) {
        clearTimeout(timer);

        const pending = useFileSaveStore.getState().saves.get(fileId);

        if (pending?.draft.projectId === projectId) save(pending.draft);
      }

      pendingTimers.clear();
    };
  }, [projectId, save]);

  return { queueSave, retry };
};
