import { cn } from 'cn';
import { formatDistanceToNow } from 'date-fns';

export { cn }; // Fallback for old shadcn components

export const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const parseGitHubUrl = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
};
