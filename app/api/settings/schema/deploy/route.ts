import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const maxDuration = 120; // Set max duration to 120 seconds

export async function POST() {
    try {
        // Hardcoded Production URL for safety in this specific admin context
        // This matches the URL in scripts/deploy-to-production.ps1 and scripts/compare-neon-schemas.js
        const DATABASE_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

        // Execute prisma migrate deploy with the production database URL
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
            env: {
                ...process.env,
                DATABASE_URL,
            },
        });

        // Strip ANSI color codes
        const cleanOutput = (stdout + stderr).replace(/\x1B\[\d+m/g, '');

        return NextResponse.json({
            success: true,
            data: {
                output: cleanOutput,
            },
        });
    } catch (error: any) {
        console.error('Schema deployment failed:', error);

        const output = error.stdout || error.stderr || error.message;
        const cleanOutput = typeof output === 'string' ? output.replace(/\x1B\[\d+m/g, '') : JSON.stringify(output);

        return NextResponse.json({
            success: false,
            error: 'Failed to deploy schema changes',
            details: cleanOutput,
        }, { status: 500 });
    }
}
