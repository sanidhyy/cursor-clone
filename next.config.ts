import type { NextConfig } from 'next';

import '@/env/client';
import '@/env/server';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
