import * as React from 'react';

import { ClerkProvider } from '@clerk/nextjs';

import { ConvexClientProvider } from './convex-client-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl='/'>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
};
