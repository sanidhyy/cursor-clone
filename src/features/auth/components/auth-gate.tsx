'use client';

import * as React from 'react';

import { RedirectToSignIn } from '@clerk/nextjs';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

import { AuthLoading as AuthLoadingView } from './auth-loading';

export const AuthGate = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <>
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
