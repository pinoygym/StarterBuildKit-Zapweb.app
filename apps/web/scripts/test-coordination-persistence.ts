import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- Coordination Center Persistence Verification ---');

    try {
        // 1. Create a test initiative
        const title = `Verification Initiative ${Date.now()}`;
        console.log(`Creating initiative: ${title}`);

        const initiative = await prisma.cooperativeInitiative.create({
            data: {
                title,
                description: 'This is a test initiative created by the verification script.',
                category: 'project',
                status: 'active',
                priority: 'medium',
                targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            }
        });

        console.log('✓ Initiative created successfully:', initiative.id);

        // 2. Retrieve the initiative
        const retrieved = await prisma.cooperativeInitiative.findUnique({
            where: { id: initiative.id }
        });

        if (retrieved && retrieved.title === title) {
            console.log('✓ Initiative retrieved successfully and data matches.');
        } else {
            throw new Error('Retrieved initiative does not match or was not found.');
        }

        // 3. Clean up (Optional, but good for repeatability)
        await prisma.cooperativeInitiative.delete({
            where: { id: initiative.id }
        });
        console.log('✓ Test data cleaned up.');

        console.log('--- Verification Complete: PASS ---');
    } catch (error) {
        console.error('--- Verification Failed ---');
        console.error(error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
