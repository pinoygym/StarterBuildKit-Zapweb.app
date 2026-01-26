'use client';

/**
 * Native utilities for Capacitor plugins.
 * These functions check for native availability and gracefully degrade on web.
 */

// Check if running in Capacitor native environment
export function isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for Capacitor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    return !!(win.Capacitor?.isNativePlatform?.() || win.Capacitor?.isNative);
}

// Get current platform
export function getPlatform(): 'ios' | 'android' | 'web' {
    if (typeof window === 'undefined') return 'web';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.Capacitor?.getPlatform) {
        return win.Capacitor.getPlatform();
    }
    return 'web';
}

/**
 * Haptic feedback utilities
 */
export const Haptics = {
    /**
     * Trigger a light impact haptic (for button taps)
     */
    async impact(style: 'Light' | 'Medium' | 'Heavy' = 'Light'): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
            const styleMap = {
                Light: ImpactStyle.Light,
                Medium: ImpactStyle.Medium,
                Heavy: ImpactStyle.Heavy,
            };
            await Haptics.impact({ style: styleMap[style] });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Trigger success/notification haptic
     */
    async notification(type: 'Success' | 'Warning' | 'Error' = 'Success'): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Haptics, NotificationType } = await import('@capacitor/haptics');
            const typeMap = {
                Success: NotificationType.Success,
                Warning: NotificationType.Warning,
                Error: NotificationType.Error,
            };
            await Haptics.notification({ type: typeMap[type] });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Trigger selection change haptic
     */
    async selectionChanged(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Haptics } = await import('@capacitor/haptics');
            await Haptics.selectionChanged();
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Vibrate device (for alerts, errors)
     */
    async vibrate(duration: number = 300): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Haptics } = await import('@capacitor/haptics');
            await Haptics.vibrate({ duration });
        } catch {
            // Silently fail on web
        }
    },
};

/**
 * Status bar utilities
 */
export const StatusBar = {
    /**
     * Set dark status bar (light content)
     */
    async setDarkContent(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            await StatusBar.setStyle({ style: Style.Dark });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Set light status bar (dark content)
     */
    async setLightContent(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            await StatusBar.setStyle({ style: Style.Light });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Set status bar background color
     */
    async setBackgroundColor(color: string): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.setBackgroundColor({ color });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Hide status bar (for immersive mode)
     */
    async hide(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.hide();
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Show status bar
     */
    async show(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.show();
        } catch {
            // Silently fail on web
        }
    },
};

/**
 * Splash screen utilities
 */
export const SplashScreen = {
    /**
     * Hide the splash screen
     */
    async hide(fadeOutDuration: number = 200): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide({ fadeOutDuration });
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Show the splash screen
     */
    async show(showDuration?: number): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.show({
                showDuration,
                autoHide: showDuration !== undefined,
            });
        } catch {
            // Silently fail on web
        }
    },
};

/**
 * Keyboard utilities
 */
export const Keyboard = {
    /**
     * Hide the keyboard
     */
    async hide(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Keyboard } = await import('@capacitor/keyboard');
            await Keyboard.hide();
        } catch {
            // Silently fail on web
        }
    },

    /**
     * Show the keyboard
     */
    async show(): Promise<void> {
        if (!isNativeApp()) return;

        try {
            const { Keyboard } = await import('@capacitor/keyboard');
            await Keyboard.show();
        } catch {
            // Silently fail on web
        }
    },
};
