import { NextResponse } from 'next/server';
import { BiometricsService } from '@/services/biometrics.service';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const { userId, data } = await req.json();

        if (!userId || !data) {
            return NextResponse.json({ error: 'Missing userId or fingerprint data' }, { status: 400 });
        }

        await BiometricsService.registerFingerprint(userId, data);

        return NextResponse.json({ success: true, message: 'Fingerprint biometrics registered successfully' });
    } catch (error) {
        logger.error('Error registering fingerprint biometrics:', error);
        return NextResponse.json({ error: 'Failed to register fingerprint biometrics' }, { status: 500 });
    }
}
