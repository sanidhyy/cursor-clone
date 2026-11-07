import { ConvexError } from 'convex/values';
import { HTTPError } from 'ky';
import { ZodError } from 'zod';

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ZodError) return error.issues[0]?.message || fallback;
  if (error instanceof Error && error.name === 'TimeoutError')
    return 'The request timed out. Please try again.';
  let message: string | undefined;
  if (error instanceof HTTPError) {
    const data = error.data as { error?: unknown } | undefined;
    if (typeof data?.error === 'string') message = data.error;
  } else if (error instanceof ConvexError && typeof error.data === 'string') message = error.data;
  else if (error instanceof Error) message = error.message;
  return message && !message.includes('[CONVEX') ? message : fallback;
};
