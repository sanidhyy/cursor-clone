import { createEnv } from '@t3-oss/env-nextjs';

import { httpUrlSchema, redirectPathSchema, secretSchema } from '../schemas/common';

export const env = createEnv({
  client: {
    // clerk api keys
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: secretSchema.startsWith('pk_'),

    // clerk redirect urls
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: redirectPathSchema,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: redirectPathSchema,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: redirectPathSchema,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: redirectPathSchema,

    // convex urls
    NEXT_PUBLIC_CONVEX_URL: httpUrlSchema,
    NEXT_PUBLIC_CONVEX_SITE_URL: httpUrlSchema,
  },
  emptyStringAsUndefined: true,
  isServer: typeof window === 'undefined',

  onValidationError: (issues) => {
    console.error('❌ Invalid environment variables:', issues);

    throw new Error('❌ Invalid environment variables');
  },

  runtimeEnv: {
    // clerk api keys
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

    // clerk redirect urls
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,

    // convex urls
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  },
});
