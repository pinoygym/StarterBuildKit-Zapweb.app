'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaceCapture } from '@/components/biometrics/FaceCapture';
import { FingerprintCapture } from '@/components/biometrics/FingerprintCapture';
import { getEmployeeByCode, registerFace, registerFingerprint } from '@/app/actions/biometrics';
import { toast } from 'sonner';
import { Search, UserCircle, ScanFace, Fingerprint as FingerprintIcon, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BiometricRegistrationPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!employeeId) return;
        setLoading(true);
        const res = await getEmployeeByCode(employeeId);
        setLoading(false);
        if (res.success) {
            setEmployee(res.data);
            toast.success('Employee found');
        } else {
            toast.error(res.error);
            setEmployee(null);
        }
    };

    const handleFaceCapture = async (descriptor: number[]) => {
        if (!employee) return;
        const res = await registerFace(employee.userId, descriptor);
        if (res.success) {
            toast.success('Face registered successfully');
        } else {
            toast.error(res.error);
        }
    };

    const handleFingerprintCapture = async (data: any) => {
        if (!employee) return;
        const res = await registerFingerprint(employee.userId, data);
        if (res.success) {
            toast.success('Fingerprint registered successfully');
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Biometric Registration</h1>
                <p className="text-muted-foreground">Enroll employee face and fingerprint data for kiosk attendance.</p>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Search Employee
                    </CardTitle>
                    <CardDescription>Enter the Employee ID to start enrollment</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <Input
                            placeholder="Employee ID (e.g. EMP001)"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                    </Button>
                </CardContent>
            </Card>

            {employee && (
                <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="md:col-span-1 border-primary/10">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <UserCircle className="h-16 w-16 text-primary" />
                            </div>
                            <CardTitle>{employee.User.firstName} {employee.User.lastName}</CardTitle>
                            <CardDescription>{employee.employeeId}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Department:</span>
                                <span className="font-medium">{employee.department || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Designation:</span>
                                <span className="font-medium">{employee.designation || 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded text-[10px] ${employee.faceBiometrics ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Face: {employee.faceBiometrics ? 'Registered' : 'Missing'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-[10px] ${employee.fingerprintBiometrics ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Fingerprint: {employee.fingerprintBiometrics ? 'Registered' : 'Missing'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border-primary/10 h-fit">
                        <Tabs defaultValue="face" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="face" className="flex items-center gap-2">
                                    <ScanFace className="h-4 w-4" />
                                    Face Scan
                                </TabsTrigger>
                                <TabsTrigger value="fingerprint" className="flex items-center gap-2">
                                    <FingerprintIcon className="h-4 w-4" />
                                    Fingerprint
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="face" className="p-4 flex justify-center">
                                <FaceCapture onCapture={handleFaceCapture} />
                            </TabsContent>
                            <TabsContent value="fingerprint" className="p-4 flex justify-center">
                                <FingerprintCapture
                                    onCapture={handleFingerprintCapture}
                                    userId={employee.userId}
                                    userName={`${employee.User.firstName} ${employee.User.lastName}`}
                                />
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            )}
        </div>
    );
}

function Separator() {
    return <div className="h-px bg-border w-full" />;
}
