import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from the local /public folder (default) — no external hosts needed
  images: {
    localPatterns: [
      { pathname: '/images/**', search: '' },
    ],
  },
};

export default nextConfig;
