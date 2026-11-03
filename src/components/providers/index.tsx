import * as React from 'react';

import { ClerkProvider } from '@clerk/nextjs';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { env as clientEnv } from '@/env/client';

import { ConvexClientProvider } from './convex-client-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ClerkProvider afterSignOutUrl={clientEnv.NEXT_PUBLIC_CLERK_SIGN_IN_URL}>
      <ConvexClientProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}

            <Toaster richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
};
