import type { Auth } from 'convex/server';
import { ConvexError } from 'convex/values';

export const verifyAuth = async (auth: Auth) => {
  const user = await auth.getUserIdentity();
  if (!user) throw new ConvexError('Unauthorized');

  return user;
};
