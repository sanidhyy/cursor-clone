import type { Auth } from 'convex/server';

export const verifyAuth = async (auth: Auth) => {
  const user = await auth.getUserIdentity();
  if (!user) throw new Error('Unauthorized');

  return user;
};
