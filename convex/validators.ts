import { v } from 'convex/values';

export const codeContextValidator = v.object({
  fileId: v.id('files'),
  path: v.string(),
  code: v.string(),
});

export const messageStatusValidator = v.union(
  v.literal('processing'),
  v.literal('completed'),
  v.literal('cancelled'),
  v.literal('incomplete')
);

export const messageStepValidator = v.object({
  id: v.string(),
  label: v.string(),
  status: v.union(v.literal('running'), v.literal('completed'), v.literal('failed')),
});

export const reasoningSummaryValidator = v.object({
  id: v.string(),
  text: v.string(),
});
