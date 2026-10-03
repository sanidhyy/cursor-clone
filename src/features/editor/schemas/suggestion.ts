import { z } from 'zod';

export const suggestionRequestSchema = z.object({
  fileName: z.string().trim().min(1),
  code: z.string().trim().min(1),
  currentLine: z.string().trim().optional(),
  previousLines: z.string().trim().optional(),
  textBeforeCursor: z.string().trim().optional(),
  textAfterCursor: z.string().trim().optional(),
  nextLines: z.string().trim().optional(),
  lineNumber: z.number().int().nonnegative(),
});

export const suggestionResponseSchema = z.object({
  suggestion: z
    .string()
    .trim()
    .describe('The code to insert at cursor, or empty string if no completion needed'),
});
