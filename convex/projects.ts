import { ConvexError, v } from 'convex/values';

import { previewSettingsSchema, projectNameSchema } from '@/features/projects/schemas';

import { mutation, query } from '@/../convex/_generated/server';
import { queryLimitSchema } from '@/schemas/common';

import { verifyAuth } from './auth';

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
