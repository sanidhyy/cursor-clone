import { z } from 'zod';

import { idSchema, promptSchema } from '@/schemas/common';

export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1, 'Conversation title is required')
  .max(100, 'Conversation title must be 100 characters or fewer');

export const sendMessageRequestSchema = z.object({
  conversationId: idSchema,
  message: promptSchema,
});
