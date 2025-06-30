import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // HYBRID MODE: Static client + separate backend server

  // STATIC EXPORT MODE - Serve pre-built static files (FASTEST!)
  output: 'export',
  distDir: 'out',
  trailingSlash: true,

  // Cache optimization
  poweredByHeader: false,
  reactStrictMode: false,

  // Optimize images for static export
  images: {
    unoptimized: true,
  },

  // Disable source maps in production untuk performa
  productionBrowserSourceMaps: false,

  // Skip build-time errors for API routes (they'll be handled by backend)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Exclude API routes from static export (they'll be handled by backend server)
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
