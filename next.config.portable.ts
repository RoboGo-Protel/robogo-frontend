import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // STATIC EXPORT MODE - Tidak butuh Node.js runtime
  output: 'export',
  distDir: 'out',
  trailingSlash: true,

  // Cache optimization
  poweredByHeader: false,
  reactStrictMode: false,

  // Optimize images untuk static export
  images: {
    unoptimized: true,
  },

  // Disable source maps in production untuk performa
  productionBrowserSourceMaps: false,

  // Skip build-time errors untuk API routes yang tidak digunakan dalam static mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Exclude API routes from static export
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Skip API routes validation for static export
  async headers() {
    return [];
  },
};

export default nextConfig;
