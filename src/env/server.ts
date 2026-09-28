import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
  extends: [vercel()],
  onInvalidAccess: (variable: string) => {
    console.error(
      '❌ Attempted to access a server-side environment variable on the client: ',
      variable
    );
    throw new Error('❌ Attempted to access a server-side environment variable on the client');
  },
  onValidationError: (issues) => {
    console.error('❌ Invalid environment variables:', issues);

    throw new Error('❌ Invalid environment variables');
  },
  server: {
    // clerk api keys
    CLERK_SECRET_KEY: z.string().trim().min(1).startsWith('sk_'),

    // firecrawl api key
    FIRECRAWL_API_KEY: z.string().trim().min(1).startsWith('fc-'),
  },
});
