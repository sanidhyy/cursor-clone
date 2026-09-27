'use client';

import * as React from 'react';

import { useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

if (!process.env.NEXT_PUBLIC_CONVEX_URL)
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file');

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const ConvexClientProvider = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
};
