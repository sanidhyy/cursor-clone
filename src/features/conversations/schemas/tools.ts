import { z } from 'zod';

import {
  fileContentSchema,
  fileNameSchema,
  filesInputSchema,
} from '@/features/projects/schemas/files';

import { httpUrlSchema, idSchema } from '@/schemas/common';

const parentIdSchema = z
  .string()
  .trim()
  .max(128, 'Parent ID is too long')
  .describe('Parent folder ID from listFiles. Use an empty string for the project root.');

const fileIdsSchema = z
  .array(idSchema)
  .min(1, 'Provide at least one file ID')
  .max(100, 'Provide at most 100 file IDs');

export const listFilesParamsSchema = z.object({});

export const readFilesParamsSchema = z.object({
  fileIds: fileIdsSchema.describe('IDs of the files to read'),
});

export const deleteFilesParamsSchema = z.object({
  fileIds: fileIdsSchema.describe('IDs of the files or folders to delete'),
});

export const updateFileParamsSchema = z.object({
  fileId: idSchema.describe('ID of the file to update'),
  content: fileContentSchema.describe('The complete replacement file content'),
});

export const renameFileParamsSchema = z.object({
  fileId: idSchema.describe('ID of the file or folder to rename'),
  newName: fileNameSchema.describe('The new file or folder name'),
});

export const createFolderParamsSchema = z.object({
  name: fileNameSchema.describe('The folder name'),
  parentId: parentIdSchema,
});

export const createFilesParamsSchema = z.object({
  parentId: parentIdSchema,
  files: filesInputSchema.describe('Files to create in the same folder'),
});

export const scrapeUrlsParamsSchema = z.object({
  urls: z
    .array(httpUrlSchema.meta({ format: undefined }))
    .min(1, 'Provide at least one URL')
    .max(5, 'Provide at most 5 URLs'),
});
