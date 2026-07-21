import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/dashboard',
  assetPrefix: '/dashboard/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;