import { cn } from 'cn';
import { formatDistanceToNow } from 'date-fns';

export { cn }; // Fallback for old shadcn components

export const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};
