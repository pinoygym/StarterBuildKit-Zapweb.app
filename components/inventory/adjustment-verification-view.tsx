'use client';

import { useState } from 'react';
import { VerificationImageViewer } from './verification-image-viewer';
import { VerificationTable, VerificationItem } from './verification-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Sparkles, CheckCheck } from 'lucide-react';

interface AdjustmentVerificationViewProps {
    adjustmentId: string;
    initialItems: any[]; // Using any for now to map from adjustment items
}

export function AdjustmentVerificationView({ adjustmentId, initialItems }: AdjustmentVerificationViewProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Map initial adjustment items to verification items
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>(() =>
        initialItems.map(item => ({
            id: item.id,
            productName: item.Product.name,
            systemQty: item.quantity,
            uom: item.uom,
            detectedQty: null,
            status: 'UNVERIFIED'
        }))
    );

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImageSrc(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRunAnalysis = () => {
        setIsAnalyzing(true);

        // SIMULATED AI ANALYSIS LOGIC
        // This mimics the discrepancies we found in the real data (e.g., ADJ-03)
        setTimeout(() => {
            setVerificationItems(prev => prev.map(item => {
                // Simulate some finding logic logic based on item names (Demo purpose)
                let detected = item.systemQty;
                let status: VerificationItem['status'] = 'MATCH';

                // Simulate the "Elite Hog Startex" mismatch found in ADJ-03
                if (item.productName.includes('Elite Hog Startex')) {
                    detected = 7; // Image had 7, DB had 3
                    status = 'MISMATCH';
                }

                // Simulate "Gromets #3" mismatch found in ADJ-08
                if (item.productName.includes('Gromets #3') && item.uom === 'pcs') {
                    detected = 54; // Image had 54, DB had 56
                    status = 'MISMATCH';
                }

                return {
                    ...item,
                    detectedQty: detected,
                    status
                };
            }));
            setIsAnalyzing(false);
        }, 1500);
    };

    const handleAcceptSystem = (id: string) => {
        setVerificationItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'MATCH', detectedQty: item.systemQty } : item
        ));
    };

    const handleAcceptDetected = (id: string, qty: number) => {
        setVerificationItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'MATCH', detectedQty: qty } : item
        ));
        // In a real app, this would also update the actual adjustment item quantity
    };

    const stats = {
        total: verificationItems.length,
        matched: verificationItems.filter(i => i.status === 'MATCH').length,
        mismatched: verificationItems.filter(i => i.status === 'MISMATCH').length
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Left Panel: Image Viewer (40%) */}
            <div className="w-[45%] flex flex-col gap-2">
                <Card className="flex-1 overflow-hidden border-2 border-dashed border-border shadow-none">
                    <VerificationImageViewer imageSrc={imageSrc} />
                </Card>
                <div className="flex justify-between items-center p-2 bg-muted/40 rounded-lg">
                    <div className="flex gap-2">
                        <Button variant="secondary" className="relative cursor-pointer">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Proof
                        </Button>
                        <Button
                            onClick={handleRunAnalysis}
                            disabled={!imageSrc || isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {isAnalyzing ? 'Analyzing...' : 'Auto-Check Items'}
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Supported: JPG, PNG • Max 10MB
                    </div>
                </div>
            </div>

            {/* Right Panel: Discrepancy Table (60%) */}
            <div className="flex-1 flex flex-col gap-2">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-card">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-lg">Verification Results</h3>
                            <div className="flex gap-2 text-sm">
                                <span className="text-green-600 font-medium">{stats.matched} Matched</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-red-600 font-medium">{stats.mismatched} Mismatch</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Finalize All
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/10">
                        <VerificationTable
                            items={verificationItems}
                            onAcceptSystem={handleAcceptSystem}
                            onAcceptDetected={handleAcceptDetected}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
