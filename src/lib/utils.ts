import { cn } from 'cn';
import { formatDistanceToNow } from 'date-fns';

import { githubRepositoryUrlSchema } from '@/features/projects/schemas/github';

export { cn }; // Fallback for old shadcn components

export const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const parseGitHubUrl = (url: string) => {
  const result = githubRepositoryUrlSchema.safeParse(url);
  if (!result.success) return null;

  const [, owner, repo] = new URL(result.data).pathname.replace(/\/$/, '').split('/');
  return { owner, repo: repo.replace(/\.git$/, '') };
};
