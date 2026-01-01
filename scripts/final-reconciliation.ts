import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Get current inventory
    const inventory = await prisma.inventory.findMany({
        include: { Product: true, Warehouse: true }
    });

    // 2. Get all audited adjustments
    const references = ['ADJ-01', 'ADJ-02', 'ADJ-03', 'ADJ-04', 'ADJ-05', 'ADJ-06', 'ADJ-07', 'ADJ-08', 'ADJ-09', 'ADJ-10'];
    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            OR: [
                { referenceNumber: { in: references } },
                { adjustmentNumber: { contains: 'ADJ-', mode: 'insensitive' } }, // broad catch
                { reason: { contains: 'ADJ-', mode: 'insensitive' } }
            ]
        },
        include: { items: { include: { Product: true } } }
    });

    // Filter to just the 10 we want by referenceNumber (exact or contains)
    const targetAdjustments = adjustments.filter(adj =>
        references.some(ref =>
            (adj.referenceNumber && adj.referenceNumber.toUpperCase().includes(ref)) ||
            (adj.reason && adj.reason.toUpperCase().includes(ref))
        )
    );

    console.log('--- RECONCILIATION DATA ---');

    // Data structure: ProductID -> { name, imageEntries: [ { ref, qty } ], currentStock: [ { warehouse, qty, uom } ] }
    const data: Record<string, any> = {};

    // Fill in inventory entries
    inventory.forEach(inv => {
        if (!data[inv.productId]) {
            data[inv.productId] = { name: inv.Product.name, imageEntries: [], currentStock: [] };
        }
        data[inv.productId].currentStock.push({
            warehouse: inv.Warehouse.name,
            quantity: inv.quantity,
            uom: inv.Product.baseUOM
        });
    });

    // Fill in adjustment entries (what was "Actual" in the logic)
    targetAdjustments.forEach(adj => {
        adj.items.forEach(item => {
            if (!data[item.productId]) {
                data[item.productId] = { name: item.Product.name, imageEntries: [], currentStock: [] };
            }
            data[item.productId].imageEntries.push({
                ref: adj.referenceNumber || adj.adjustmentNumber,
                quantity: item.quantity,
                uom: item.uom
            });
        });
    });

    // Sort by product name
    const sortedIds = Object.keys(data).sort((a, b) => data[a].name.localeCompare(data[b].name));

    sortedIds.forEach(id => {
        const item = data[id];
        if (item.imageEntries.length > 0) {
            console.log(`PRODUCT|${item.name}`);
            item.imageEntries.forEach((e: any) => console.log(`IMAGE|${e.ref}|${e.quantity}|${e.uom}`));
            item.currentStock.forEach((s: any) => console.log(`STOCK|${s.warehouse}|${s.quantity}|${s.uom}`));
            console.log('---');
        }
    });
}

main().finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
