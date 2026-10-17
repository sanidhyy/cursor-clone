import { ConvexHttpClient } from 'convex/browser';

import { env as envClient } from '@/env/client';

export const convex = new ConvexHttpClient(envClient.NEXT_PUBLIC_CONVEX_URL);
