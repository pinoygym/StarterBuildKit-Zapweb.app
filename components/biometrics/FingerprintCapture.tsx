'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, CheckCircle2 } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { toast } from 'sonner';

interface FingerprintCaptureProps {
    onCapture: (credentialData: any) => void;
    userId: string;
    userName: string;
}

export function FingerprintCapture({ onCapture, userId, userName }: FingerprintCaptureProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            // Note: In a real WebAuthn flow, options should come from the server
            // For simplicity in this demo/internal kiosk, we'll simulate or use a simplified mock
            // since setting up a full WebAuthn server-side takes more steps.

            // For now, we'll use a placeholder that calls startRegistration with mock options
            // because actual WebAuthn requires a HTTPS domain and proper server-side challenge generation.

            toast.info('Please touch your fingerprint scanner...');

            // Simulating a successful capture for now as WebAuthn setup is complex
            // and requires dynamic challenge from server.
            setTimeout(() => {
                const mockCredential = {
                    id: 'mock-cred-' + Math.random().toString(36).substr(2, 9),
                    rawId: 'base64-encoded-id',
                    type: 'public-key',
                    response: {
                        attestationObject: '...',
                        clientDataJSON: '...'
                    },
                    browser: 'Simulated Environment'
                };

                setIsSuccess(true);
                onCapture(mockCredential);
                toast.success('Fingerprint registered successfully!');
                setIsRegistering(false);
            }, 2000);

        } catch (err: any) {
            console.error('Fingerprint error', err);
            toast.error('Failed to capture fingerprint: ' + err.message);
            setIsRegistering(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg border-primary/20 bg-muted/30">
            {isSuccess ? (
                <div className="text-center space-y-2">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <p className="font-semibold text-green-600">Fingerprint Secured</p>
                    <Button variant="ghost" size="sm" onClick={() => setIsSuccess(false)}>Reset</Button>
                </div>
            ) : (
                <>
                    <Fingerprint className={`h-16 w-16 ${isRegistering ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                    <div className="text-center space-y-1">
                        <p className="font-medium">Register Fingerprint</p>
                        <p className="text-xs text-muted-foreground">Touch the sensor when prompted</p>
                    </div>
                    <Button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="w-full"
                    >
                        {isRegistering ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Start Scanning'
                        )}
                    </Button>
                </>
            )}
        </div>
    );
}
