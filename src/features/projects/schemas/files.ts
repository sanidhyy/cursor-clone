import { z } from 'zod';

import { codeSchema } from '@/schemas/common';

export const fileNameSchema = z
  .string()
  .trim()
  .min(1, 'File or folder name is required')
  .max(255, 'File or folder name must be 255 characters or fewer')
  .regex(/^[^/\\\u0000-\u001f\u007f]+$/, 'Use a single name without slashes or control characters')
  .refine((name) => name !== '.' && name !== '..', 'File or folder name cannot be "." or ".."');

export const fileContentSchema = codeSchema;

export const fileInputSchema = z.object({
  name: fileNameSchema,
  content: fileContentSchema,
});

export const filesInputSchema = z
  .array(fileInputSchema)
  .min(1, 'Provide at least one file')
  .max(100, 'Create at most 100 files at a time')
  .refine(
    (files) => new Set(files.map((file) => file.name)).size === files.length,
    'File names in a batch must be unique'
  );
