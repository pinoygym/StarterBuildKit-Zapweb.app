'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FaceCaptureProps {
    onCapture: (descriptor: number[]) => void;
}

export function FaceCapture({ onCapture }: FaceCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setIsLoaded(true);
            } catch (err) {
                console.error('Failed to load face-api models', err);
                setError('Failed to load face recognition models. Ensure they are in /public/models');
            }
        };
        loadModels();
    }, []);

    const startVideo = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            videoRef.current.srcObject = stream;
        } catch (err) {
            console.error('Error accessing camera', err);
            setError('Could not access camera. Please ensure permissions are granted.');
        }
    };

    const captureFace = async () => {
        if (!videoRef.current || !isLoaded) return;
        setIsDetecting(true);
        try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                onCapture(Array.from(detection.descriptor));
                toast.success('Face pattern captured successfully!');
            } else {
                toast.error('No face detected. Please try again.');
            }
        } catch (err) {
            console.error('Detection error', err);
            toast.error('Error during face detection');
        } finally {
            setIsDetecting(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            startVideo();
        }
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isLoaded]);

    if (error) return <div className="text-red-500 p-4 border rounded bg-red-50">{error}</div>;

    return (
        <div className="flex flex-col items-center gap-4">
            {!isLoaded ? (
                <div className="flex items-center gap-2 p-8">
                    <Loader2 className="animate-spin" />
                    <span>Loading AI Models...</span>
                </div>
            ) : (
                <>
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full max-w-sm border-2 border-primary/20">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isDetecting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Loader2 className="animate-spin text-white h-12 w-12" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={captureFace}
                            disabled={isDetecting}
                            className="flex items-center gap-2"
                        >
                            <Camera className="h-4 w-4" />
                            Capture Face
                        </Button>
                        <Button
                            variant="outline"
                            onClick={startVideo}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
