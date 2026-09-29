import { formatDistanceToNow } from 'date-fns';

export { cn } from 'cn';

export const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};
