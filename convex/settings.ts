import { v } from 'convex/values';

import { AI_SETTINGS_MAX_AGE } from '@/features/settings/constants';

import { internal } from './_generated/api';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import { validateInternalKey } from './auth';

export const getEncryptedAISettings = query({
  args: { internalKey: v.string(), ownerId: v.string() },
  handler: async ({ db }, { internalKey, ownerId }) => {
    validateInternalKey(internalKey);

    const settings = await db
      .query('userSettings')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .unique();

    return settings && settings.updatedAt > Date.now() - AI_SETTINGS_MAX_AGE ? settings : null;
  },
});

export const saveAISettings = mutation({
  args: { internalKey: v.string(), ownerId: v.string(), apiKey: v.string() },
  handler: async ({ db }, { internalKey, ownerId, apiKey }) => {
    validateInternalKey(internalKey);

    const settings = await db
      .query('userSettings')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .unique();
    const value = { apiKey, updatedAt: Date.now() };

    if (settings) await db.patch('userSettings', settings._id, value);
    else await db.insert('userSettings', { ownerId, ...value });

    return { success: true };
  },
});

export const removeAISettings = mutation({
  args: { internalKey: v.string(), ownerId: v.string() },
  handler: async ({ db }, { internalKey, ownerId }) => {
    validateInternalKey(internalKey);

    const settings = await db
      .query('userSettings')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .unique();

    if (settings) await db.delete('userSettings', settings._id);

    return { success: true };
  },
});

const deleteExpiredSettings = async ({ db, scheduler }: MutationCtx, cutoff: number) => {
  const settings = await db
    .query('userSettings')
    .withIndex('by_updated_at', (q) => q.lte('updatedAt', cutoff))
    .take(100);

  for (const item of settings) await db.delete('userSettings', item._id);

  if (settings.length === 100)
    await scheduler.runAfter(0, internal.settings.deleteExpiredAISettings, { cutoff });

  return { deleted: settings.length };
};

export const deleteExpiredAISettings = internalMutation({
  args: { cutoff: v.number() },
  handler: (ctx, { cutoff }) => deleteExpiredSettings(ctx, cutoff),
});

export const removeExpiredAISettings = mutation({
  args: { internalKey: v.string() },
  handler: (ctx, { internalKey }) => {
    validateInternalKey(internalKey);

    return deleteExpiredSettings(ctx, Date.now() - AI_SETTINGS_MAX_AGE);
  },
});
