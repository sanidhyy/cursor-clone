import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async ({ auth, db }, { name }) => {
    const user = await auth.getUserIdentity();
    if (!user) throw new Error('Unauthorized');

    await db.insert('projects', {
      name,
      ownerId: user.subject,
    });
  },
});

export const get = query({
  args: {},
  handler: async ({ auth, db }) => {
    const user = await auth.getUserIdentity();
    if (!user) return [];

    const projects = await db
      .query('projects')
      .withIndex('by_owner', (q) => q.eq('ownerId', user.subject))
      .collect();

    return projects;
  },
});
