import * as React from 'react';

import { ClerkProvider } from '@clerk/nextjs';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ConvexClientProvider } from './convex-client-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl='/'>
      <ConvexClientProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
};
