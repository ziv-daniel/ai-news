import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export for GitHub Pages
  images: {
    unoptimized: true  // Required for static export
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ai-news' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ai-news/' : '',
  // Proxy webhook calls in development to avoid CORS issues
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/webhook/:path*',
        destination: 'https://n8n.danielshaprvt.work/webhook/:path*',
      },
    ] : [];
  },
};

export default nextConfig;
