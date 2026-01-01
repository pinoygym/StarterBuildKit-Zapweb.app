import { prisma } from '@/lib/prisma';

// Data extracted from the uploaded warehouse daily inventory image (ADJ-01)
// Note: Items marked as "no count" or crossed out are excluded as per user request
const imageData = [
    // OBS - WAREHOUSE DAILY INVENTORY
    { name: 'Ama concentrated', qty: 2, unit: 'Box' },
    { name: 'Anti-Amag', qty: 14, unit: 'Box' },
    { name: 'Bakers Choice', qty: 12, unit: 'pail' },
    { name: 'Baking Soda', qty: 1, unit: 'sack' },
    { name: 'Blueberry 1kg', qty: 1, unit: 'wholesale' },
    { name: 'Calumet 14kg H', qty: 22, unit: 'sack' },
    // Carbonato - crossed out (no count) - EXCLUDED
    { name: 'Cinnamon Powder', qty: 1, unit: 'drum' },
    { name: 'Cornstarch', qty: 8, unit: 'sack' },
    { name: 'Cream of Tartar', qty: 9, unit: 'sack' },
    { name: 'Desiccated Coconut', qty: 5, unit: 'sack' },
    { name: 'Debrim', qty: 49, unit: 'box' },
    { name: 'Doner', qty: 7, unit: 'cel' },
    { name: 'Lihia Water', qty: 2, unit: 'box' },
    { name: 'Longas', qty: 11, unit: 'Gal' },
    { name: 'Orange Oil', qty: 8, unit: 'box' },
    { name: 'Panadero Premier Active Dry', qty: 14, unit: 'pail' },
    { name: 'Sprinter Unico', qty: 14, unit: 'box' },
    { name: 'Ultra Soft', qty: 2, unit: 'box' },

    // DAIRY
    { name: 'Alaska Evaporada 370ml Yellow', qty: 7, unit: 'box' },
    { name: 'Alaska Evaporated 370ml Red', qty: 91, unit: 'box' },
    { name: 'Angel Evaporated 410ml', qty: 2, unit: 'box' },
    { name: 'Cheezee', qty: 7, unit: 'box' },
    { name: 'Doreen Condensed', qty: 5, unit: 'box' },
    { name: 'Dairy Bake', qty: 5, unit: 'sack' },
    { name: 'Farmland', qty: 8, unit: 'sack' },
    { name: 'Masterchef', qty: 6, unit: 'Gal' },

    // FLOUR
    { name: 'All Purpose Flour', qty: 22, unit: 'sack' },
    { name: 'Cake Flour', qty: 19, unit: 'sack' },
    { name: 'General', qty: 24, unit: 'sack' },
    { name: 'Island 25kg', qty: 27, unit: 'sack' },
    { name: 'Megastar', qty: 1, unit: 'sack' },
    { name: 'Silverstar 25kg', qty: 4, unit: 'sack' },
    { name: 'Sunflour', qty: 27, unit: 'sack' },
    { name: 'Sunshine', qty: 20, unit: 'sack' },
    { name: 'CF Redbowl', qty: 2, unit: 'sack' },

    // VANILLA
    { name: 'Vanilla - 120', qty: 1, unit: 'box' },
    { name: 'Vanilla - Concentrated', qty: 2, unit: 'box' },
    { name: 'Vanilla - Oil', qty: 1, unit: 'box' },
    { name: 'Vanilla - Orion', qty: 6, unit: 'box' },

    // Right side of image
    { name: 'Bensdorp', qty: 11, unit: 'Gal' },
    { name: 'Emmir Victory Coroa', qty: 7, unit: 'sack' },
    { name: 'Hershey', qty: 1, unit: 'box' },
    { name: 'LPF', qty: 7, unit: 'box' },
    { name: 'Ube Powder (16 Kg)', qty: 2, unit: 'box' },
    { name: 'FOOD COLOR', qty: 1, unit: 'box' },
    { name: 'Foodcolor - Choco Brown', qty: 2, unit: 'box' },
    { name: 'Foodcolor - E.g Yellow', qty: 2, unit: 'box' },
    { name: 'Foodcolor - Orange', qty: 4, unit: 'box' },
    { name: 'Foodcolor - R.car Pink', qty: 4, unit: 'box' },
    { name: 'Foodcolor - Straw Red', qty: 4, unit: 'box' },
    { name: 'Foodcolor - Ube Violet G', qty: 8, unit: 'box' },
    { name: 'SUGAR & SALT', qty: 1, unit: 'box' },
    { name: 'Brown Sugar', qty: 20, unit: 'sack' },
    { name: 'Nimula', qty: 1, unit: 'box' },
    { name: 'Penco', qty: 7, unit: 'box' },
    { name: 'White Sugar', qty: 25, unit: 'sack' },
    { name: 'Iodized Salt', qty: 10, unit: 'sack' },
    { name: 'Rocksalt', qty: 5, unit: 'sack' },

    // OIL, MARGARINE & SHORTENING
    { name: 'Bambi Butter', qty: 7, unit: 'box' },
    { name: 'Bambi Lard', qty: 1, unit: 'box' },
    { name: 'Butter Oil', qty: 1, unit: 'box' },
    { name: 'Cano Oil 15', qty: 5, unit: 'container' },
    { name: 'Rainbow Oil', qty: 5, unit: 'pail' },
    { name: 'Select', qty: 8, unit: 'box' },
    { name: 'Snowlar', qty: 8, unit: 'drum' },
    { name: 'Sunrise Margarine G', qty: 7, unit: 'drum' },

    // YEAST
    { name: 'Bakel Platinum Inst Aft Active', qty: 26, unit: 'box' },
    { name: 'Mauri pan', qty: 2, unit: 'box' },
    { name: 'Redstar Active Yeast', qty: 2, unit: 'box' },

    // Bottom items
    { name: 'Flavorich Black', qty: 1, unit: 'bag' },
    { name: 'Flavorich Brown', qty: 2, unit: 'bag' },
    { name: 'Queso', qty: 7, unit: 'box' },
];

async function compareInventory() {
    console.log('🔍 Comparing Inventory Data from Image vs Live Database\n');
    console.log('='.repeat(100));

    const discrepancies: any[] = [];
    const matched: any[] = [];
    const notFoundInDB: any[] = [];

    for (const imageItem of imageData) {
        // Try to find the product in the database (case-insensitive search)
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: imageItem.name,
                    mode: 'insensitive',
                },
            },
            include: {
                Inventory: {
                    include: {
                        Warehouse: true,
                    },
                },
            },
        });

        if (products.length === 0) {
            // Try partial match
            const nameParts = imageItem.name.split(' ');
            const partialProducts = await prisma.product.findMany({
                where: {
                    OR: nameParts.map(part => ({
                        name: {
                            contains: part,
                            mode: 'insensitive',
                        },
                    })),
                },
                include: {
                    Inventory: {
                        include: {
                            Warehouse: true,
                        },
                    },
                },
            });

            if (partialProducts.length > 0) {
                console.log(`⚠️  "${imageItem.name}" not found exactly, but found ${partialProducts.length} partial matches:`);
                partialProducts.forEach(p => {
                    const totalQty = p.Inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
                    console.log(`   - ${p.name} (${p.baseUOM}): ${totalQty} in DB`);
                });
                notFoundInDB.push(imageItem);
            } else {
                console.log(`❌ "${imageItem.name}" not found in database`);
                notFoundInDB.push(imageItem);
            }
            continue;
        }

        // If multiple products found, use the first one (or best match)
        const product = products[0];
        const totalInventory = product.Inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);

        const result = {
            productName: imageItem.name,
            dbName: product.name,
            imageQty: imageItem.qty,
            imageUnit: imageItem.unit,
            dbQty: totalInventory,
            dbUnit: product.baseUOM,
            warehouses: product.Inventory.map(inv => ({
                name: inv.Warehouse.name,
                qty: Number(inv.quantity),
            })),
        };

        // Compare quantities (considering unit differences)
        if (Math.abs(totalInventory - imageItem.qty) > 0.01) {
            discrepancies.push({
                ...result,
                difference: totalInventory - imageItem.qty,
            });
            console.log(`\n⚠️  DISCREPANCY FOUND:`);
            console.log(`   Product: ${imageItem.name} → ${product.name}`);
            console.log(`   Image: ${imageItem.qty} ${imageItem.unit}`);
            console.log(`   Database: ${totalInventory} ${product.baseUOM}`);
            console.log(`   Difference: ${(totalInventory - imageItem.qty).toFixed(2)}`);
            if (product.Inventory.length > 1) {
                console.log(`   Warehouses:`);
                product.Inventory.forEach(inv => {
                    console.log(`      - ${inv.Warehouse.name}: ${inv.quantity}`);
                });
            }
        } else {
            matched.push(result);
            console.log(`✅ ${imageItem.name}: ${imageItem.qty} ${imageItem.unit} (MATCH)`);
        }
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📊 SUMMARY:');
    console.log(`   Total items in image: ${imageData.length}`);
    console.log(`   ✅ Matched: ${matched.length}`);
    console.log(`   ⚠️  Discrepancies: ${discrepancies.length}`);
    console.log(`   ❌ Not found in DB: ${notFoundInDB.length}`);

    if (discrepancies.length > 0) {
        console.log('\n\n📋 DETAILED DISCREPANCIES:');
        console.log('='.repeat(100));
        discrepancies.forEach((disc, idx) => {
            console.log(`\n${idx + 1}. ${disc.productName}`);
            console.log(`   DB Name: ${disc.dbName}`);
            console.log(`   Image: ${disc.imageQty} ${disc.imageUnit}`);
            console.log(`   Database: ${disc.dbQty} ${disc.dbUnit}`);
            console.log(`   Difference: ${disc.difference > 0 ? '+' : ''}${disc.difference.toFixed(2)}`);
            if (disc.warehouses.length > 0) {
                console.log(`   Warehouses:`);
                disc.warehouses.forEach((wh: any) => {
                    console.log(`      - ${wh.name}: ${wh.qty}`);
                });
            }
        });
    }

    if (notFoundInDB.length > 0) {
        console.log('\n\n🔍 ITEMS NOT FOUND IN DATABASE:');
        console.log('='.repeat(100));
        notFoundInDB.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.name} (${item.qty} ${item.unit})`);
        });
    }

    await prisma.$disconnect();
}

compareInventory().catch(console.error);
