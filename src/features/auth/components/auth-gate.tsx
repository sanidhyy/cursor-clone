'use client';

import * as React from 'react';

import { UserButton } from '@clerk/nextjs';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

import { AuthLoading as AuthLoadingView } from './auth-loading';
import { Unauthenticated as UnauthenticatedView } from './unauthenticated';

export const AuthGate = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <>
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
    </>
  );
};
