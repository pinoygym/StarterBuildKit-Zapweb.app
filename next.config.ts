import type { NextConfig } from "next";

// Trigger rebuild

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress hydration warnings in development (browser extensions like Dark Reader can cause these)
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // TODO: Restrict this to actual image hosts for improved security and performance. E.g., 'your-image-cdn.com', 'res.cloudinary.com'
      },
    ],
  },
  // Skip static optimization for deployment compatibility
  output: 'standalone',
};

export default nextConfig;
