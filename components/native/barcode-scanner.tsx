'use client';

import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, X, Smartphone } from 'lucide-react';
import { isNativeApp } from '@/lib/native-utils';

interface BarcodeScannerProps {
    onScan: (barcode: string, format?: string) => void;
    onError?: (error: Error) => void;
    buttonText?: string;
    className?: string;
}

/**
 * BarcodeScanner component for scanning product barcodes.
 * Works on native Capacitor builds (iOS/Android).
 * Shows message on web indicating native app is required.
 */
export function BarcodeScanner({
    onScan,
    onError,
    buttonText = 'Scan Barcode',
    className = '',
}: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isNative, setIsNative] = useState<boolean | null>(null);

    // Check if running on native platform
    useEffect(() => {
        setIsNative(isNativeApp());
    }, []);

    const startScan = useCallback(async () => {
        try {
            // Dynamic import for Capacitor plugin
            const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');

            setIsScanning(true);

            // Scan barcode using the v3 API
            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: CapacitorBarcodeScannerTypeHint.ALL,
            });

            setIsScanning(false);

            if (result.ScanResult) {
                onScan(result.ScanResult);
            }
        } catch (error) {
            setIsScanning(false);
            const err = error instanceof Error ? error : new Error('Failed to scan barcode');
            onError?.(err);
        }
    }, [onScan, onError]);

    // Loading state
    if (isNative === null) {
        return (
            <Button
                type="button"
                variant="outline"
                className={className}
                disabled
            >
                <ScanLine className="w-4 h-4" />
                {buttonText && <span className="ml-2">{buttonText}</span>}
            </Button>
        );
    }

    // Web fallback - show message that native app is required
    if (!isNative) {
        return (
            <div className={`text-muted-foreground text-xs text-right ${className}`}>
                <div className="flex items-center gap-1 justify-end">
                    <Smartphone className="w-3 h-3" />
                    <span>Barcode scanning requires the native app.</span>
                </div>
                <span>Use manual entry instead.</span>
            </div>
        );
    }

    // Scanning in progress
    if (isScanning) {
        return (
            <Button
                type="button"
                variant="outline"
                className={className}
                onClick={() => setIsScanning(false)}
            >
                <X className="w-4 h-4" />
                {buttonText && <span className="ml-2">Cancel</span>}
            </Button>
        );
    }

    // Native scan button
    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            onClick={startScan}
        >
            <ScanLine className="w-4 h-4" />
            {buttonText && <span className="ml-2">{buttonText}</span>}
        </Button>
    );
}

/**
 * Hook for programmatic barcode scanning
 */
export function useBarcodeScanner() {
    const [isScanning, setIsScanning] = useState(false);
    const [lastBarcode, setLastBarcode] = useState<string | null>(null);

    const scan = useCallback(async (): Promise<string | null> => {
        if (!isNativeApp()) {
            console.warn('Barcode scanning is only available in native apps');
            return null;
        }

        try {
            const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');

            setIsScanning(true);

            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: CapacitorBarcodeScannerTypeHint.ALL,
            });

            setIsScanning(false);

            if (result.ScanResult) {
                setLastBarcode(result.ScanResult);
                return result.ScanResult;
            }

            return null;
        } catch (error) {
            setIsScanning(false);
            console.error('Barcode scan error:', error);
            return null;
        }
    }, []);

    const stopScan = useCallback(() => {
        setIsScanning(false);
    }, []);

    return {
        scan,
        stopScan,
        isScanning,
        lastBarcode,
        isSupported: isNativeApp(),
    };
}
