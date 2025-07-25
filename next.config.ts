import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kreate-primary-bucket.f8de059d05ea939eefe99c6564a3e9af.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      // Add other domains if needed
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
