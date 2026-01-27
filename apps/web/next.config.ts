import type { NextConfig } from "next";

// Trigger rebuild

// Check if building for Capacitor mobile app
const isMobileBuild = process.env.CAPACITOR === 'true';

const nextConfig: NextConfig = isMobileBuild ? {
  // Mobile-specific configuration for Capacitor
  output: 'export',
  // transpilePackages removed for debugging
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_IS_CAPACITOR: 'true',
  },
  experimental: {
    // @ts-ignore
    skipTrailingSlashRedirect: true,
    turbo: {
      root: process.cwd(),
    },
  },
} : {
  // Standard web configuration
  distDir: process.env.IS_PLAYWRIGHT === 'true' ? '.next-test' : '.next',

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: [
    '@inventory-pro/app',
    'nativewind',
    'react-native-css-interop',
    'solito',
    'react-native-web',
    'react-native-safe-area-context'
  ],
  output: 'standalone',

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ]
      }
    ]
  },
  experimental: {
  },

  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
    },
    resolveExtensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
};

export default nextConfig;
