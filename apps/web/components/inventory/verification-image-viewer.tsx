'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Maximize, RotateCcw } from 'lucide-react';

interface VerificationImageViewerProps {
    imageSrc?: string | null;
}

export function VerificationImageViewer({ imageSrc }: VerificationImageViewerProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleReset = () => {
        setScale(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (!imageSrc) {
        return (
            <div className="h-full flex items-center justify-center bg-muted/20 border-r text-muted-foreground border-border">
                <div className="text-center">
                    <p>No image selected.</p>
                    <p className="text-xs mt-1">Upload an image to start verification.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-r border-border">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-background z-10">
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center text-xs font-mono w-12 justify-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotate">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Reset View">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Image Viewport */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-100 dark:bg-slate-900"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageSrc}
                        alt="Verification Proof"
                        className="max-h-full max-w-full object-contain shadow-lg"
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}
