import { z } from 'zod';

import { fileNameSchema } from '@/features/projects/schemas/files';

import { codeSchema, promptSchema } from '@/schemas/common';

export const quickEditRequestSchema = z.object({
  fileName: fileNameSchema,
  selectedCode: codeSchema.min(1),
  fullCode: codeSchema.min(1),
  instruction: promptSchema,
});

export const quickEditResponseSchema = z.object({
  editedCode: codeSchema.describe(
    'The edited version of the selected code based on the instruction'
  ),
});
