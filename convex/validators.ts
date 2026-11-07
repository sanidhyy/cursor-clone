import { v } from 'convex/values';

export const messageStatusValidator = v.union(
  v.literal('processing'),
  v.literal('completed'),
  v.literal('cancelled'),
  v.literal('incomplete')
);
