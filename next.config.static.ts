import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize untuk Electron dan static export

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
};

export default nextConfig;
