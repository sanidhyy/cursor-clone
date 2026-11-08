import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';

import { cn } from 'cn';

import { Providers } from '@/components/providers';
import { SITE_CONFIG } from '@/config';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = SITE_CONFIG;

const RootLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <html
      lang='en'
      className={cn('h-full', 'antialiased', inter.variable, plexMono.variable, 'font-sans')}
      suppressHydrationWarning
    >
      <body className='flex min-h-full flex-col'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
