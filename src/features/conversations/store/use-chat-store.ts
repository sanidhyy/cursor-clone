import { create } from 'zustand';

import { codeContextsSchema, type CodeContext } from '@/features/conversations/schemas';

import type { Id } from '@/../convex/_generated/dataModel';

interface ChatDraft {
  input: string;
  context: CodeContext[];
}

const defaultDraft: ChatDraft = { input: '', context: [] };

interface ChatStore {
  drafts: Map<Id<'projects'>, ChatDraft>;
  getDraft: (projectId: Id<'projects'>) => ChatDraft;
  setInput: (projectId: Id<'projects'>, input: string) => void;
  addContext: (projectId: Id<'projects'>, context: CodeContext) => void;
  removeContext: (projectId: Id<'projects'>, index: number) => void;
  clearSubmitted: (projectId: Id<'projects'>, input: string, context: CodeContext[]) => void;
}

export const useChatStore = create<ChatStore>()((set, get) => {
  const update = (projectId: Id<'projects'>, draft: ChatDraft) => {
    const drafts = new Map(get().drafts);

    drafts.set(projectId, draft);
    set({ drafts });
  };

  return {
    drafts: new Map(),

    getDraft: (projectId) => get().drafts.get(projectId) || defaultDraft,

    setInput: (projectId, input) => update(projectId, { ...get().getDraft(projectId), input }),

    addContext: (projectId, context) => {
      const draft = get().getDraft(projectId);

      if (
        draft.context.some((item) => item.fileId === context.fileId && item.code === context.code)
      )
        return;

      const items = codeContextsSchema.parse([...draft.context, context]);

      update(projectId, { ...draft, context: [...draft.context, items[items.length - 1]] });
    },

    removeContext: (projectId, index) => {
      const draft = get().getDraft(projectId);

      update(projectId, { ...draft, context: draft.context.filter((_, i) => i !== index) });
    },

    clearSubmitted: (projectId, input, context) => {
      const draft = get().getDraft(projectId);

      update(projectId, {
        input: draft.input === input ? '' : draft.input,
        context: draft.context.filter((item) => !context.includes(item)),
      });
    },
  };
});
