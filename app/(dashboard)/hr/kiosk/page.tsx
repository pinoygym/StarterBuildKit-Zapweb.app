'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clockIn, clockOut } from '@/app/actions/hr';
import { toast } from 'sonner';
import { Loader2, UserCheck, LogOut } from 'lucide-react';

export default function KioskPage() {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClockIn = async () => {
        if (!userId) return toast.error('Please enter User ID');
        setLoading(true);
        const res = await clockIn(userId);
        setLoading(false);
        if (res.success) {
            toast.success('Clocked In Successfully');
            setUserId('');
        } else {
            toast.error(res.error);
        }
    };

    const handleClockOut = async () => {
        if (!userId) return toast.error('Please enter User ID');
        setLoading(true);
        const res = await clockOut(userId);
        setLoading(false);
        if (res.success) {
            toast.success('Clocked Out Successfully');
            setUserId('');
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/20">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-primary">Attendance Kiosk</CardTitle>
                    <CardDescription>Enter your ID to log your attendance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
            </Card>
        </div>
    );
}
