import type { Auth } from 'convex/server';
import { ConvexError } from 'convex/values';

export const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) throw new Error('POLARIS_CONVEX_INTERNAL_KEY is not configured');
  if (key !== internalKey) throw new Error('Unauthorized');
};

export const verifyAuth = async (auth: Auth) => {
  const user = await auth.getUserIdentity();

  if (!user) throw new ConvexError('Unauthorized');

  return user;
};
