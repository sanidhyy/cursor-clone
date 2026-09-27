'use client';

import * as React from 'react';

import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({ children }: Readonly<React.PropsWithChildren>) => {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
};
