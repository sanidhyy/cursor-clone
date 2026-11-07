import { z } from 'zod';

import { codeSchema, idSchema, promptSchema } from '@/schemas/common';

export const codeContextSchema = z.object({
  fileId: idSchema,
  path: z
    .string()
    .trim()
    .min(1)
    .max(4096)
    .regex(/^[^\u0000-\u001f\u007f]+$/),
  code: codeSchema.min(1).max(20_000, 'Select at most 20,000 characters to add to chat'),
});

export const codeContextsSchema = z
  .array(codeContextSchema)
  .max(5, 'Attach at most 5 code selections');

export type CodeContext = z.infer<typeof codeContextSchema>;

export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1, 'Conversation title is required')
  .max(100, 'Conversation title must be 100 characters or fewer');

export const sendMessageRequestSchema = z.object({
  conversationId: idSchema,
  message: promptSchema,
  context: codeContextsSchema.default([]),
});
