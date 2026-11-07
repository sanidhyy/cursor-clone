import { z } from 'zod';

import { fileNameSchema } from '@/features/projects/schemas/files';

import { codeSchema } from '@/schemas/common';

export const suggestionRequestSchema = z.object({
  fileName: fileNameSchema,
  code: codeSchema.min(1),
  currentLine: codeSchema.optional(),
  previousLines: codeSchema.optional(),
  textBeforeCursor: codeSchema.optional(),
  textAfterCursor: codeSchema.optional(),
  nextLines: codeSchema.optional(),
  lineNumber: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const suggestionResponseSchema = z.object({
  suggestion: codeSchema.describe(
    'The code to insert at cursor, or empty string if no completion needed'
  ),
});
