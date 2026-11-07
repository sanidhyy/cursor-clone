import { z } from 'zod';

import { httpUrlSchema, idSchema } from '@/schemas/common';

export const repositoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Repository name is required')
  .max(100, 'Repository name is too long')
  .regex(/^(?!\.{1,2}$)[a-zA-Z0-9._-]+$/, 'Use letters, numbers, hyphens, underscores, or dots');

export const githubRepositoryUrlSchema = httpUrlSchema.refine((value) => {
  try {
    const url = new URL(value);
    const parts = url.pathname.replace(/\/$/, '').split('/');
    return (
      ['github.com', 'www.github.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      parts.length === 3 &&
      /^[a-zA-Z0-9-]+$/.test(parts[1]) &&
      repositoryNameSchema.safeParse(parts[2].replace(/\.git$/, '')).success
    );
  } catch {
    return false;
  }
}, 'Enter a GitHub repository URL, such as https://github.com/owner/repo');

export const importGitHubRequestSchema = z.object({ url: githubRepositoryUrlSchema });

const visibilitySchema = z.enum(['public', 'private']);
const descriptionSchema = z.string().trim().max(350, 'Description is too long');

export const exportGitHubFormSchema = z.object({
  repoName: repositoryNameSchema,
  visibility: visibilitySchema,
  description: descriptionSchema,
});

export const exportGitHubRequestSchema = exportGitHubFormSchema.extend({
  projectId: idSchema,
  visibility: visibilitySchema.default('private'),
  description: descriptionSchema.optional(),
});
