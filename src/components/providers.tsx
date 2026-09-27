import * as React from 'react';

import { ClerkProvider } from '@clerk/nextjs';

import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl='/'>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
};
