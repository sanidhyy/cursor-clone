import { z } from 'zod';

import { idSchema, promptSchema } from '@/schemas/common';

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be 100 characters or fewer')
  .regex(/^[^\u0000-\u001f\u007f]+$/, 'Project name cannot contain control characters');

export const projectRequestSchema = z.object({ projectId: idSchema });
export const createProjectRequestSchema = z.object({ prompt: promptSchema });

const commandSchema = z.string().trim().max(500, 'Command must be 500 characters or fewer');

export const previewSettingsFormSchema = z.object({
  installCommand: commandSchema,
  devCommand: commandSchema,
});

export const previewSettingsSchema = previewSettingsFormSchema.partial();
