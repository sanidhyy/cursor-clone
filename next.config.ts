import type { NextConfig } from 'next';

import '@/env/client';
import '@/env/server';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  headers: () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
