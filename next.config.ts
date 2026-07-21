import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Change 'sensifies-dashboard' to your exact GitHub repository name
  basePath: '/sensifies-dashboard', 
  assetPrefix: '/sensifies-dashboard/',
  images: {
    unoptimized: true, // Required for static export images
  },
};

export default nextConfig;