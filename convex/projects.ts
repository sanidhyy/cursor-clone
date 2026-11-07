import { ConvexError, v } from 'convex/values';

import { previewSettingsSchema, projectNameSchema } from '@/features/projects/schemas';

import { internal } from '@/../convex/_generated/api';
import { internalMutation, mutation, query } from '@/../convex/_generated/server';
import { queryLimitSchema } from '@/schemas/common';

import { verifyAuth } from './auth';

export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async ({ auth, db, scheduler }, { id }) => {
    const user = await verifyAuth(auth);
    const project = await db.get('projects', id);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');
    if (project.importStatus === 'importing' || project.exportStatus === 'exporting')
      throw new ConvexError(
        'Wait for the GitHub import or export to finish before deleting this project'
      );

    const processing = await db
      .query('messages')
      .withIndex('by_project_status', (q) => q.eq('projectId', id).eq('status', 'processing'))
      .first();

    if (processing)
      throw new ConvexError('Stop the active AI request before deleting this project');

    // Removing the parent revokes access immediately. Cleanup continues in bounded batches.
    await db.delete('projects', id);
    await scheduler.runAfter(0, internal.projects.cleanup, { projectId: id });
  },
});

export const cleanup = internalMutation({
  args: { projectId: v.id('projects') },
  handler: async ({ db, storage, scheduler }, { projectId }): Promise<void> => {
    if (await db.get('projects', projectId)) throw new Error('Project must be deleted first');

    const files = await db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .take(10);

    for (const file of files) {
      if (file.storageId) await storage.delete(file.storageId);
      await db.delete('files', file._id);
    }

    if (files.length) {
      await scheduler.runAfter(0, internal.projects.cleanup, { projectId });
      return;
    }

    const messages = await db
      .query('messages')
      .withIndex('by_project_status', (q) => q.eq('projectId', projectId))
      .take(10);

    for (const message of messages) await db.delete('messages', message._id);

    if (messages.length) {
      await scheduler.runAfter(0, internal.projects.cleanup, { projectId });
      return;
    }

    const conversations = await db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .take(10);
    for (const conversation of conversations) await db.delete('conversations', conversation._id);

    if (conversations.length) await scheduler.runAfter(0, internal.projects.cleanup, { projectId });
  },
});

export const updateSettings = mutation({
  args: {
    id: v.id('projects'),
    settings: v.object({
      installCommand: v.optional(v.string()),
      devCommand: v.optional(v.string()),
    }),
  },

  handler: async ({ auth, db }, { id: projectId, settings }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');

    const validatedSettings = previewSettingsSchema.parse(settings);

    await db.patch('projects', projectId, {
      settings: {
        installCommand: validatedSettings.installCommand || undefined,
        devCommand: validatedSettings.devCommand || undefined,
      },
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async ({ auth, db }, { limit }) => {
    const user = await verifyAuth(auth);

    if (limit !== undefined) {
      return await db
        .query('projects')
        .withIndex('by_owner_updated_at', (q) => q.eq('ownerId', user.subject))
        .order('desc')
        .take(queryLimitSchema.parse(limit));
    }

    return await db
      .query('projects')
      .withIndex('by_owner_updated_at', (q) => q.eq('ownerId', user.subject))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { id: v.string() },

  handler: async ({ auth, db }, { id }) => {
    const user = await verifyAuth(auth);
    const projectId = db.normalizeId('projects', id);

    if (!projectId) return null;

    const project = await db.get('projects', projectId);

    return project?.ownerId === user.subject ? project : null;
  },
});

export const rename = mutation({
  args: {
    id: v.id('projects'),
    name: v.string(),
  },

  handler: async ({ auth, db }, { id: projectId, name: projectName }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);

    if (!project || project.ownerId !== user.subject) throw new ConvexError('Project not found');

    await db.patch('projects', projectId, {
      name: projectNameSchema.parse(projectName),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});
