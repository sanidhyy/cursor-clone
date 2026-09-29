import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { verifyAuth } from './auth';

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async ({ auth, db }, { name }) => {
    const user = await verifyAuth(auth);

    const projectId = await db.insert('projects', {
      name,
      ownerId: user.subject,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

export const get = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async ({ auth, db }, { limit }) => {
    const user = await verifyAuth(auth);

    if (!!limit) {
      return await db
        .query('projects')
        .withIndex('by_owner', (q) => q.eq('ownerId', user.subject))
        .order('desc')
        .take(limit);
    }

    return await db
      .query('projects')
      .withIndex('by_owner', (q) => q.eq('ownerId', user.subject))
      .order('desc')
      .collect();
  },
});
