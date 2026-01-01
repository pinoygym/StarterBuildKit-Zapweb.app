import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST() {
    try {
        // Execute the comparison script
        // Note: adjusting the path to the script relative to the project root
        const { stdout, stderr } = await execAsync('node scripts/compare-neon-schemas.js');

        // Strip ANSI color codes from the output for clean display in the frontend
        // Regex covers standard ANSI escape codes
        const cleanOutput = (stdout + stderr).replace(/\x1B\[\d+m/g, '');

        return NextResponse.json({
            success: true,
            data: {
                output: cleanOutput
            }
        });
    } catch (error: any) {
        console.error('Schema comparison failed:', error);

        // Even if the script returns an error/exit code, we might want to see the output
        const output = error.stdout || error.stderr || error.message;
        const cleanOutput = typeof output === 'string' ? output.replace(/\x1B\[\d+m/g, '') : JSON.stringify(output);

        return NextResponse.json({
            success: false,
            error: 'Failed to compare schemas',
            details: cleanOutput
        }, { status: 500 });
    }
}
