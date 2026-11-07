import { v } from 'convex/values';

import { conversationTitleSchema } from '@/features/conversations/schemas';

import { mutation, query } from '@/../convex/_generated/server';

import { verifyAuth } from './auth';

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
  },
  handler: async ({ auth, db }, { projectId, title }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

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
    if (!conversation) throw new Error('Conversation not found');

    const project = await db.get('projects', conversation.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Conversation not found');

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
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

    const conversations = await db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
    return conversations;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async ({ auth, db }, { conversationId }) => {
    const user = await verifyAuth(auth);

    const conversation = await db.get('conversations', conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const project = await db.get('projects', conversation.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Conversation not found');

    const messages = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();
    return messages;
  },
});
