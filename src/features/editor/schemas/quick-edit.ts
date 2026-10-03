import { z } from 'zod';

export const quickEditRequestSchema = z.object({
  fileName: z.string().trim().min(1),
  selectedCode: z.string().trim().min(1),
  fullCode: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
});

export const quickEditResponseSchema = z.object({
  editedCode: z
    .string()
    .trim()
    .describe('The edited version of the selected code based on the instruction'),
});
