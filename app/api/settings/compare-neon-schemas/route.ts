import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        // Run the comparison script
        const scriptPath = path.join(process.cwd(), 'scripts', 'compare-neon-schemas.js');

        const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
            cwd: process.cwd(),
            timeout: 60000, // 60 second timeout
        });

        if (stderr && !stderr.includes('Loaded Prisma config')) {
            console.error('Script stderr:', stderr);
        }

        return NextResponse.json({
            success: true,
            data: {
                message: 'Schema comparison completed successfully. Check schema-comparison-report.json for details.',
                output: stdout,
                errors: stderr || undefined,
            },
        });
    } catch (error: any) {
        console.error('Error running schema comparison:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to run schema comparison',
                data: {
                    output: error.stdout || '',
                    errors: error.stderr || error.message,
                },
            },
            { status: 500 }
        );
    }
}
