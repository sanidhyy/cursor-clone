'use client';

import * as React from 'react';

import { ClerkProvider, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

import { ConvexClientProvider } from './convex-client-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl='/'>
      <ConvexClientProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <Authenticated>
            <UserButton />
          </Authenticated>

          <Unauthenticated>
            <SignInButton />
            <SignUpButton />
          </Unauthenticated>

          <AuthLoading>Loading...</AuthLoading>

          {children}
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
};
