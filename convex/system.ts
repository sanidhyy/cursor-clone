import { v } from 'convex/values';

import { mutation, query } from '@/../convex/_generated/server';

const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) throw new Error('POLARIS_CONVEX_INTERNAL_KEY is not configured');
  if (key !== internalKey) throw new Error('Unauthorized');
};

export const getConversationById = query({
  args: {
    conversationId: v.id('conversations'),
    internalKey: v.string(),
  },
  handler: async ({ db }, { conversationId, internalKey }) => {
    validateInternalKey(internalKey);

    return await db.get('conversations', conversationId);
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id('conversations'),
    projectId: v.id('projects'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    status: v.optional(
      v.union(v.literal('processing'), v.literal('completed'), v.literal('cancelled'))
    ),
  },
  handler: async ({ db }, { internalKey, conversationId, projectId, role, content, status }) => {
    validateInternalKey(internalKey);

    const messageId = await db.insert('messages', {
      conversationId,
      projectId,
      role,
      content,
      status,
    });

    await db.patch('conversations', conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    content: v.string(),
  },
  handler: async ({ db }, { internalKey, messageId, content }) => {
    validateInternalKey(internalKey);

    await db.patch('messages', messageId, { content, status: 'completed' });
  },
});

export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    status: v.union(v.literal('processing'), v.literal('completed'), v.literal('cancelled')),
  },
  handler: async ({ db }, { internalKey, messageId, status }) => {
    validateInternalKey(internalKey);

    await db.patch('messages', messageId, { status });
  },
});

export const processingMessages = query({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
  },
  handler: async ({ db }, { internalKey, projectId }) => {
    validateInternalKey(internalKey);

    const messages = await db
      .query('messages')
      .withIndex('by_project_status', (q) =>
        q.eq('projectId', projectId).eq('status', 'processing')
      )
      .collect();

    return messages;
  },
});
