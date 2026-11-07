import { ConvexError, v } from 'convex/values';

import { conversationTitleSchema } from '@/features/conversations/schemas';

import { internal } from '@/../convex/_generated/api';
import { internalMutation, mutation, query } from '@/../convex/_generated/server';

import { verifyAuth } from './auth';

export const remove = mutation({
  args: { id: v.id('conversations') },
  handler: async ({ auth, db, scheduler }, { id }) => {
    const user = await verifyAuth(auth);
    const conversation = await db.get('conversations', id);
    const project = conversation && (await db.get('projects', conversation.projectId));
    if (!project || project.ownerId !== user.subject)
      throw new ConvexError('Conversation not found');

    const processing = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', id))
      .filter((q) => q.eq(q.field('status'), 'processing'))
      .first();
    if (processing)
      throw new ConvexError('Stop the active AI request before deleting this conversation');

    await db.delete('conversations', id);
    await scheduler.runAfter(0, internal.conversations.cleanup, { conversationId: id });
  },
});

export const cleanup = internalMutation({
  args: { conversationId: v.id('conversations') },
  handler: async ({ db, scheduler }, { conversationId }): Promise<void> => {
    if (await db.get('conversations', conversationId))
      throw new Error('Conversation must be deleted first');
    const messages = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .take(10);
    for (const message of messages) await db.delete('messages', message._id);
    if (messages.length)
      await scheduler.runAfter(0, internal.conversations.cleanup, { conversationId });
  },
});

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
  },

  handler: async ({ auth, db }, { projectId, title }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');

    const conversationId = await db.insert('conversations', {
      projectId,
      title: conversationTitleSchema.parse(title),
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getById = query({
  args: {
    id: v.id('conversations'),
  },

  handler: async ({ auth, db }, { id: conversationId }) => {
    const user = await verifyAuth(auth);

    const conversation = await db.get('conversations', conversationId);

    if (!conversation) return null;

    const project = await db.get('projects', conversation.projectId);

    if (!project || project.ownerId !== user.subject)
      throw new ConvexError('Conversation not found');

    return conversation;
  },
});

export const getByProject = query({
  args: {
    projectId: v.id('projects'),
  },

  handler: async ({ auth, db }, { projectId }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');

    const conversations = await db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();

    return conversations;
  },
});

export const isProjectProcessing = query({
  args: { projectId: v.id('projects') },

  handler: async ({ auth, db }, { projectId }) => {
    const user = await verifyAuth(auth);
    const project = await db.get('projects', projectId);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');

    const message = await db
      .query('messages')
      .withIndex('by_project_status', (q) =>
        q.eq('projectId', projectId).eq('status', 'processing')
      )
      .first();

    return !!message;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id('conversations'),
  },

  handler: async ({ auth, db }, { conversationId }) => {
    const user = await verifyAuth(auth);

    const conversation = await db.get('conversations', conversationId);

    if (!conversation) return [];

    const project = await db.get('projects', conversation.projectId);

    if (!project || project.ownerId !== user.subject)
      throw new ConvexError('Conversation not found');

    const messages = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();

    return messages;
  },
});
