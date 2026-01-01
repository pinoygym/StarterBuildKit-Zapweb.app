import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { writeFileSync } from 'fs';

async function verifyAdjustmentStatus() {
    try {
        console.log('Checking adjustment statuses...');

        const adjustments = await prisma.inventoryAdjustment.findMany({
            select: {
                adjustmentNumber: true,
                status: true,
                adjustmentDate: true,
            },
            orderBy: {
                adjustmentDate: 'desc'
            }
        });

        const totalCount = adjustments.length;

        const statusCounts = adjustments.reduce((acc, adj) => {
            acc[adj.status] = (acc[adj.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const recentAdjustments = adjustments.slice(0, 10).map(adj => ({
            adjustmentNumber: adj.adjustmentNumber,
            status: adj.status,
            date: adj.adjustmentDate.toISOString().split('T')[0]
        }));

        const result = {
            totalAdjustments: totalCount,
            statusBreakdown: statusCounts,
            recentAdjustments
        };

        // Write to file
        writeFileSync('adjustment-status-report.json', JSON.stringify(result, null, 2));

        // Console output
        console.log(`\nTotal adjustments: ${totalCount}`);
        console.log('\nStatus breakdown:', JSON.stringify(statusCounts, null, 2));
        console.log(`\n✅ Report written to adjustment-status-report.json`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdjustmentStatus();
