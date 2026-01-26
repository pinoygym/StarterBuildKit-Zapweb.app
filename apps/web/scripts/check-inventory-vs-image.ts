/**
 * Script to check database inventory against the uploaded image ADJ-01
 * This script queries the inventory table and displays data for comparison
 * NO DATA WILL BE MODIFIED
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function checkInventory() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is not defined');
        return;
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    try {
        console.log('=== INVENTORY DATABASE CHECK - ADJ-01 Comparison ===\n');

        // Get all inventory records with product details
        const inventoryRecords = await prisma.inventory.findMany({
            include: {
                Product: {
                    include: {
                        productUOMs: true,
                    }
                },
                Warehouse: {
                    include: {
                        Branch: true
                    }
                },
            },
            orderBy: {
                Product: {
                    name: 'asc'
                }
            }
        });

        console.log(`Total inventory records found: ${inventoryRecords.length}\n`);
        console.log('='.repeat(120));
        console.log('Product Name'.padEnd(35) + 'Warehouse'.padEnd(20) + 'Quantity'.padEnd(15) + 'UOM'.padEnd(10) + 'Base UOM'.padEnd(15));
        console.log('='.repeat(120));

        for (const record of inventoryRecords) {
            const productName = record.Product.name.substring(0, 34);
            const warehouse = record.Warehouse.name.substring(0, 19);
            const quantity = record.quantity.toString();
            const uom = record.Product.baseUOM || 'N/A';

            console.log(
                productName.padEnd(35) +
                warehouse.padEnd(20) +
                quantity.padEnd(15) +
                uom.padEnd(10)
            );

            // Show alternate UOMs if available
            if (record.Product.productUOMs && record.Product.productUOMs.length > 0) {
                for (const uomRecord of record.Product.productUOMs) {
                    console.log(
                        '  └─ Alt UOM:'.padEnd(35) +
                        ''.padEnd(20) +
                        `${uomRecord.conversionFactor} ${record.Product.baseUOM}`.padEnd(15) +
                        `= 1 ${uomRecord.name}`.padEnd(10)
                    );
                }
            }
        }

        console.log('='.repeat(120));

        // Get specific products that appear in the image
        console.log('\n=== SPECIFIC PRODUCTS FROM IMAGE ===\n');

        const imageProducts = [
            'Amag Concentrated',
            'Anti-Amag',
            'Bakers Choice',
            'Baking Soda',
            'Blueberry Kkg',
            'Calumet 14kg H',
            'Carbonato',
            'Cinnamon Powder',
            'Cornstarch',
            'Cream of Tartar',
            'Desiccated Coconut',
            'Dobrim',
            'Doner',
            'Lihua Water',
            'Longga',
            'Orange Oil',
            'Panadero Premier Active Dry',
            'Sprinter Unico',
            'Ultra Soft',
            'Alaska Evaporada 370ml Yellow',
            'Alaska Evaporated 370ml Red',
            'Angel Evaporated 410ml',
            'Cheezee',
            'Doreen Condensed',
            'Dairy Bake',
            'Farmland',
            'Masterchef',
            'All Purpose Flour',
            'Cake Flour',
            'Cracked Wheat',
            'General',
            'Island 25kg',
            'Megastar',
            'Silverstar 25kg',
            'Sunflour',
            'Sunshine',
            'CF Redbowl',
            'Bensdorp',
            'Emmir Victory Corona',
            'Hershey',
            'UBE',
            'Ube Powder (6hr)',
            'FOOD COLOR',
            'Foodcolor - Choco Brown',
            'Foodcolor - E.g Yellow',
            'Foodcolor - Orange',
            'Foodcolor - Rose Pink',
            'Foodcolor - Straw Red',
            'Foodcolor - Ube Violet G',
            'SUGAR & SALT',
            'Brown Sugar',
            'Vinuba',
            'Penco',
            'White Sugar',
            'Iodized Salt',
            'Rocksalt',
            'OIL MARGARINE & SHORTENING',
            'Bambi Butter',
            'Bambi Lard',
            'Butter Oil',
            'Cano Oil 15',
            'Rainbow Oil',
            'Select',
            'Snowlan',
            'Sunrise Margarine G',
            'VANILLA',
            'Vanilla - 120',
            'Vanilla - 60ml',
            'Vanilla - Concentrated',
            'Vanilla - Oil',
            'Vanilla - Orion',
            'YEAST',
            'Baker Platinum Instant Active',
            'Mauri pan',
            'Redstar Active Yeast',
            'Flavorich Black',
            'Flavorich Brown',
            'Quezo'
        ];

        for (const productName of imageProducts) {
            const inventory = await prisma.inventory.findMany({
                where: {
                    Product: {
                        name: {
                            contains: productName,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    Product: {
                        include: {
                            productUOMs: true
                        }
                    },
                    Warehouse: {
                        include: {
                            Branch: true
                        }
                    }
                }
            });

            if (inventory.length > 0) {
                console.log(`\n📦 ${productName}:`);
                for (const inv of inventory) {
                    console.log(`   Warehouse: ${inv.Warehouse.name}`);
                    console.log(`   Branch: ${inv.Warehouse.Branch.name}`);
                    console.log(`   Quantity: ${inv.quantity} ${inv.Product.baseUOM || ''}`);

                    if (inv.Product.productUOMs && inv.Product.productUOMs.length > 0) {
                        console.log(`   Alternate UOMs:`);
                        for (const uomRecord of inv.Product.productUOMs) {
                            console.log(`     - ${uomRecord.name}: ${uomRecord.conversionFactor} ${inv.Product.baseUOM} = 1 ${uomRecord.name}`);
                        }
                    }
                }
            } else {
                console.log(`\n❌ ${productName}: NOT FOUND IN DATABASE`);
            }
        }

    } catch (error) {
        console.error('Error querying inventory:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkInventory();
