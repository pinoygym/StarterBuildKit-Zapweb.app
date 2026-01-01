import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { rawProducts, RawProduct } from './data/raw-products';

// Helper to normalize names for grouping
function normalizeName(name: string): string {
    let normalized = name;

    // Remove specific suffixes
    const suffixesToRemove = [
        ' G', ' H',
        ' (G)', ' (H)',
        ' (Retail)', ' (Case)', ' Pack',
        ' (Retail) G', ' (Case) H'
    ];

    for (const suffix of suffixesToRemove) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.substring(0, normalized.length - suffix.length);
        }
    }

    // Regex replacements for more complex patterns
    // Remove (48cans), (24pcs), etc.
    normalized = normalized.replace(/\s*\(\d+.*?\)/g, '');

    // Remove " (Retail)" or " (Case)" if missed by simple suffix check (case insensitive)
    normalized = normalized.replace(/\s*\((?:Retail|Wholesale|Case|Pack)\)/gi, '');

    // Remove weight/size info IF it's likely a bulk specifier at the end (e.g. " 50kg", " 14kg")
    // But be careful not to remove "410ml" if it's part of the base info
    // strict G/H removal if missed by loop
    normalized = normalized.replace(/\s+[GH]$/, '');

    // Remove trailing " H" or " G" if they were part of a parenthesis that got cleaned partly?
    // The previous loop handles " G", " H".

    return normalized.trim();
}

function parseQuantity(qtyString?: string): number {
    if (!qtyString) return 1;
    // Extract first number found
    const match = qtyString.match(/(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    return 1;
}

export async function seedImageProducts(prisma: PrismaClient) {
    console.log(`Seeding ${rawProducts.length} products from raw data...`);

    // Group by normalized name
    const groups: { [key: string]: RawProduct[] } = {};

    for (const item of rawProducts) {
        const normName = normalizeName(item.name);
        if (!groups[normName]) {
            groups[normName] = [];
        }
        groups[normName].push(item);
    }

    console.log(`Found ${Object.keys(groups).length} unique product groups.`);

    for (const name in groups) {
        const items = groups[name];

        // Strategy:
        // 1. Find Retail ('G') item for Base Product
        // 2. Find Wholesale ('H') items for UOMs

        const retailItem = items.find(i =>
            i.category === 'Retail' ||
            i.type === 'Retail' ||
            i.name.endsWith(' G') ||
            i.name.endsWith('(G)')
        );

        const wholesaleItems = items.filter(i => i !== retailItem);

        // Determine Base Product Info
        const baseItem = retailItem || wholesaleItems[0]; // Fallback to wholesale if no retail

        if (!baseItem) continue;

        let product = await prisma.product.findFirst({ where: { name: baseItem.name } });

        // Use the normalized name for the product name mostly, but maybe nicer?
        // Let's use the Base Item's name but stripped of the G suffix for display
        const productName = normalizeName(baseItem.name);

        // Check again with normalized name
        let existingProduct = await prisma.product.findFirst({ where: { name: productName } });

        if (!existingProduct) {
            existingProduct = await prisma.product.create({
                data: {
                    id: crypto.randomUUID(),
                    name: productName,
                    description: `${baseItem.desc} - ${baseItem.spec} ${baseItem.manuf ? '(' + baseItem.manuf + ')' : ''}`,
                    category: baseItem.spec,
                    basePrice: baseItem.cost,
                    baseUOM: baseItem.unit || (retailItem ? 'PCS' : 'CASE'), // Default logic
                    minStockLevel: 10,
                    shelfLifeDays: 365,
                    status: 'active',
                    updatedAt: new Date(),
                }
            });
            console.log(`Created: ${productName}`);
        }

        // Add UOMs
        for (const wsItem of wholesaleItems) {
            // Determine UOM name
            let uomName = wsItem.unit;
            if (!uomName) {
                // Infer from name or default
                if (wsItem.name.toLowerCase().includes('sac')) uomName = 'SACK';
                else if (wsItem.name.toLowerCase().includes('box')) uomName = 'BOX';
                else if (wsItem.name.toLowerCase().includes('pail')) uomName = 'PAIL';
                else uomName = 'WHOLESALE_UNIT';
            }

            // Skip if UOM name same as base
            if (uomName === existingProduct.baseUOM) continue;

            // Calculate Conversion
            // If explicit qty provided in data (e.g. 48 CANS/BOX)
            let conversion = 1;
            if (wsItem.qty && wsItem.qty.match(/\d+/)) {
                conversion = parseQuantity(wsItem.qty);
            } else {
                // Price ratio fallback
                if (wsItem.cost > existingProduct.basePrice) {
                    conversion = Math.round(wsItem.cost / existingProduct.basePrice);
                }
            }

            // Sanity check conversion
            if (conversion < 2) conversion = 1; // Avoid 1:1 if not distinct?

            const uomExists = await prisma.productUOM.findFirst({
                where: { productId: existingProduct.id, name: uomName }
            });

            if (!uomExists) {
                await prisma.productUOM.create({
                    data: {
                        id: crypto.randomUUID(),
                        productId: existingProduct.id,
                        name: uomName,
                        conversionFactor: conversion,
                        sellingPrice: wsItem.cost,
                    }
                });
                console.log(`  + UOM ${uomName} (x${conversion})`);
            }
        }
    }
}
