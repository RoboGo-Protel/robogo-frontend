import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize untuk Electron dan mengurangi refresh yang tidak perlu

  // Cache optimization
  poweredByHeader: false,
  reactStrictMode: false,

  // Optimize images untuk electron
  images: {
    unoptimized: true,
  },

  // Disable source maps in production untuk performa
  productionBrowserSourceMaps: false,

  // Optimize bundling
  swcMinify: true,

  // Headers untuk caching yang lebih baik
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
