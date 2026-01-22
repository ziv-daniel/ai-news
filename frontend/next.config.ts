import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export for GitHub Pages
  images: {
    unoptimized: true  // Required for static export
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ai-news' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ai-news/' : '',
};

export default nextConfig;
