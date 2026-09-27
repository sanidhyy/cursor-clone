'use client';

import * as React from 'react';

import { useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

import { env as envClient } from '@/env/client';

const convex = new ConvexReactClient(envClient.NEXT_PUBLIC_CONVEX_URL);

export const ConvexClientProvider = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
};
