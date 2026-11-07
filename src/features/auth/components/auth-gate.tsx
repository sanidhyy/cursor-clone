'use client';

import * as React from 'react';

import { RedirectToSignIn } from '@clerk/nextjs';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

import { ConnectionStatus } from '@/components/connection-status';

import { AuthLoading as AuthLoadingView } from './auth-loading';

export const AuthGate = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <>
      <ConnectionStatus />
      <Authenticated>{children}</Authenticated>

      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      <AuthLoading>
        <AuthLoadingView />
      </AuthLoading>
    </>
  );
};
