import { z } from 'zod';

import { MAX_SUGGESTION_PAYLOAD_LENGTH } from '@/features/editor/constants';

import { MAX_SUGGESTION_LENGTH } from '@/constants';

export const suggestionRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(MAX_SUGGESTION_PAYLOAD_LENGTH.FILE_NAME),
  code: z.string().trim().min(1).max(MAX_SUGGESTION_PAYLOAD_LENGTH.CODE),
  currentLine: z.string().trim().max(MAX_SUGGESTION_PAYLOAD_LENGTH.CURRENT_LINE).optional(),
  previousLines: z.string().trim().max(MAX_SUGGESTION_PAYLOAD_LENGTH.PREVIOUS_LINES).optional(),
  textBeforeCursor: z
    .string()
    .trim()
    .max(MAX_SUGGESTION_PAYLOAD_LENGTH.TEXT_BEFORE_CURSOR)
    .optional(),
  textAfterCursor: z
    .string()
    .trim()
    .max(MAX_SUGGESTION_PAYLOAD_LENGTH.TEXT_AFTER_CURSOR)
    .optional(),
  nextLines: z.string().trim().max(MAX_SUGGESTION_PAYLOAD_LENGTH.NEXT_LINES).optional(),
  lineNumber: z.number().int().nonnegative(),
});

export const suggestionResponseSchema = z.object({
  suggestion: z
    .string()
    .max(MAX_SUGGESTION_LENGTH)
    .describe('The code to insert at cursor, or empty string if no completion needed'),
});
