'use client';

import * as React from 'react';

import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

import { AuthLoadingView } from '@/features/auth/components/auth-loading-view';
import { UnauthenticatedView } from '@/features/auth/components/unauthenticated-view';

import { ConvexClientProvider } from './convex-client-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl='/'>
      <ConvexClientProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <Authenticated>
            <UserButton />
            {children}
          </Authenticated>

          <Unauthenticated>
            <UnauthenticatedView />
          </Unauthenticated>

          <AuthLoading>
            <AuthLoadingView />
          </AuthLoading>
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
};
