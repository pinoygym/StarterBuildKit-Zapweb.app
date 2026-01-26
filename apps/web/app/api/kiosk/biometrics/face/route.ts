import { NextResponse } from 'next/server';
import { BiometricsService } from '@/services/biometrics.service';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const { userId, descriptor } = await req.json();

        if (!userId || !descriptor) {
            return NextResponse.json({ error: 'Missing userId or descriptor' }, { status: 400 });
        }

        await BiometricsService.registerFace(userId, descriptor);

        return NextResponse.json({ success: true, message: 'Face biometrics registered successfully' });
    } catch (error) {
        logger.error('Error registering face biometrics:', error);
        return NextResponse.json({ error: 'Failed to register face biometrics' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const descriptors = await BiometricsService.getAllEmployeeFaceDescriptors();
        return NextResponse.json(descriptors);
    } catch (error) {
        logger.error('Error fetching face descriptors:', error);
        return NextResponse.json({ error: 'Failed to fetch face descriptors' }, { status: 500 });
    }
}
