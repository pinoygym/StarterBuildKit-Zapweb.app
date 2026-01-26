'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clockIn, clockOut } from '@/app/actions/hr';
import { getAllFaceDescriptors } from '@/app/actions/biometrics';
import { toast } from 'sonner';
import { Loader2, UserCheck, LogOut, ScanFace, Fingerprint, ShieldCheck, UserCircle } from 'lucide-react';
import { FaceCapture } from '@/components/biometrics/FaceCapture';
import { FingerprintCapture } from '@/components/biometrics/FingerprintCapture';
import * as faceapi from 'face-api.js';

export default function KioskPage() {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'id' | 'face' | 'fingerprint'>('id');
    const [verifiedUser, setVerifiedUser] = useState<{ id: string, name: string } | null>(null);
    const [faceDescriptors, setFaceDescriptors] = useState<any[]>([]);

    useEffect(() => {
        const loadDescriptors = async () => {
            const res = await getAllFaceDescriptors();
            if (res.success) {
                setFaceDescriptors(res.data);
            }
        };
        loadDescriptors();
    }, []);

    const handleClockIn = async () => {
        const id = verifiedUser?.id || userId;
        if (!id) return toast.error('Please enter User ID or Verify Biometrics');
        setLoading(true);
        const res = await clockIn(id);
        setLoading(false);
        if (res.success) {
            toast.success('Clocked In Successfully');
            resetKiosk();
        } else {
            toast.error(res.error);
        }
    };

    const handleClockOut = async () => {
        const id = verifiedUser?.id || userId;
        if (!id) return toast.error('Please enter User ID or Verify Biometrics');
        setLoading(true);
        const res = await clockOut(id);
        setLoading(false);
        if (res.success) {
            toast.success('Clocked Out Successfully');
            resetKiosk();
        } else {
            toast.error(res.error);
        }
    };

    const resetKiosk = () => {
        setUserId('');
        setVerifiedUser(null);
        setMode('id');
    };

    const handleFaceIdentify = async (capturedDescriptor: number[]) => {
        if (faceDescriptors.length === 0) {
            return toast.error('No registered face patterns found in system.');
        }

        setLoading(true);
        // face-api expects Float32Array for descriptors
        const labeledDescriptors = faceDescriptors.map(fd => {
            return new faceapi.LabeledFaceDescriptors(fd.employeeId, [new Float32Array(fd.descriptor)]);
        });

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        const bestMatch = faceMatcher.findBestMatch(new Float32Array(capturedDescriptor));

        if (bestMatch.label !== 'unknown') {
            const matchedEmp = faceDescriptors.find(fd => fd.employeeId === bestMatch.label);
            setVerifiedUser({ id: matchedEmp.employeeId, name: matchedEmp.fullName });
            toast.success(`Welcome, ${matchedEmp.fullName}!`);
            setMode('id');
        } else {
            toast.error('Face not recognized. Please try again or use ID.');
        }
        setLoading(false);
    };

    const handleFingerprintVerify = (data: any) => {
        // In a real WebAuthn flow, this would send 'data' to server for verification
        // For this demo, we'll assume successful verification if fingerprint is matched
        toast.success('Fingerprint Verified!');
        // Ideally we'd have the user's ID from the fingerprint data
        // For now, if they entered an ID, we verify it.
        if (userId) {
            setVerifiedUser({ id: userId, name: 'Verified User' });
        }
        setMode('id');
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/20 p-4">
            <Card className="w-full max-w-xl shadow-lg border-primary/20">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Attendance Kiosk
                    </CardTitle>
                    <CardDescription>
                        {verifiedUser ? `Authenticated as ${verifiedUser.name}` : 'Verify your identity to log attendance'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {verifiedUser ? (
                        <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <UserCircle className="h-16 w-16 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold">{verifiedUser.name}</p>
                                <p className="text-sm text-muted-foreground">{verifiedUser.id}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <Button
                                    size="lg"
                                    className="h-24 text-xl flex flex-col gap-2 bg-green-600 hover:bg-green-700"
                                    onClick={handleClockIn}
                                    disabled={loading}
                                >
                                    <UserCheck className="h-8 w-8" />
                                    Clock In
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-24 text-xl flex flex-col gap-2 bg-red-600 hover:bg-red-700"
                                    onClick={handleClockOut}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <LogOut className="h-8 w-8" />}
                                    Clock Out
                                </Button>
                            </div>
                            <Button variant="ghost" className="mt-2" onClick={resetKiosk}>Not you? Switch user</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {mode === 'id' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userId" className="text-lg">Employee ID / Scan Badge</Label>
                                        <Input
                                            id="userId"
                                            placeholder="Scan or type ID..."
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            className="h-12 text-lg text-center tracking-widest"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <Button
                                            variant="outline"
                                            className="h-32 flex flex-col gap-3 text-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                                            onClick={() => setMode('face')}
                                        >
                                            <ScanFace className="h-12 w-12 text-primary" />
                                            Scan Face
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-32 flex flex-col gap-3 text-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                                            onClick={() => setMode('fingerprint')}
                                        >
                                            <Fingerprint className="h-12 w-12 text-primary" />
                                            Fingerprint
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button className="flex-1 h-12" onClick={handleClockIn} disabled={loading || !userId}>
                                            Quick Clock In
                                        </Button>
                                        <Button className="flex-1 h-12" variant="destructive" onClick={handleClockOut} disabled={loading || !userId}>
                                            Quick Clock Out
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {mode === 'face' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-center font-semibold mb-4">Face Recognition</h3>
                                    <FaceCapture onCapture={handleFaceIdentify} />
                                    <Button variant="ghost" className="w-full mt-4" onClick={() => setMode('id')}>Cancel</Button>
                                </div>
                            )}

                            {mode === 'fingerprint' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-center font-semibold mb-4">Fingerprint Verification</h3>
                                    <FingerprintCapture
                                        onCapture={handleFingerprintVerify}
                                        userId={userId}
                                        userName=""
                                    />
                                    <Button variant="ghost" className="w-full mt-4" onClick={() => setMode('id')}>Cancel</Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
