import type { NextConfig } from "next";

/**
 * Mobile-specific Next.js configuration for Capacitor builds.
 * This config generates a static export suitable for wrapping in native apps.
 * 
 * Usage:
 *   NEXT_CONFIG=mobile next build
 *   
 * Or use the npm script:
 *   bun run build:mobile
 */

const mobileConfig: NextConfig = {
    // Static HTML export for Capacitor
    output: 'export',

    // Disable image optimization (not available in static export)
    images: {
        unoptimized: true,
    },

    // Add trailing slashes for static file compatibility
    trailingSlash: true,

    // Output directory for the static export
    distDir: 'out',

    // TypeScript configuration
    typescript: {
        ignoreBuildErrors: true,
    },

    // React strict mode
    reactStrictMode: false,

    // Disable x-powered-by header
    poweredByHeader: false,

    // Asset prefix for CDN (can be configured for production)
    // assetPrefix: process.env.ASSET_PREFIX || '',

    // Environment-specific configuration
    env: {
        NEXT_PUBLIC_IS_CAPACITOR: 'true',
    },
};

export default mobileConfig;
