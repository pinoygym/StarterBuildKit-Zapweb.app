import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inventorypro.app',
    appName: 'InventoryPro',
    webDir: 'out',

    // Server configuration for development
    // Comment out for production builds that use the bundled web assets
    server: {
        // Use your Vercel production URL for development
        // url: 'https://your-app.vercel.app',
        // cleartext: true, // Allow HTTP for development

        // For local development, you can use:
        // url: 'http://YOUR_LOCAL_IP:3000',
        // cleartext: true,
    },

    // iOS-specific configuration
    ios: {
        contentInset: 'automatic',
        allowsLinkPreview: true,
        scrollEnabled: true,
        preferredContentMode: 'mobile',
        // Enable full-screen mode with safe area insets
        limitsNavigationsToAppBoundDomains: true,
    },

    // Android-specific configuration
    android: {
        // Enable hardware back button handling
        allowMixedContent: false,
        captureInput: true,
        useLegacyBridge: false,
        // Splash screen configuration
        backgroundColor: '#0f172a',
    },

    // Plugins configuration
    plugins: {
        // Splash Screen
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            launchFadeOutDuration: 500,
            backgroundColor: '#0f172a',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },

        // Status Bar
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0f172a',
        },

        // Push Notifications
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
    },
};

export default config;
