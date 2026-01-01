import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Instantiate PrismaClient with PG Adapter
const connectionString = process.env.OVERRIDE_DB_URL || process.env.DATABASE_URL;
console.log('Connecting to DB:', connectionString ? connectionString.replace(/:[^:@]*@/, ':****@') : 'UNDEFINED');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting script execution...');
    const filePath = path.join(process.cwd(), 'excel/OBS ITEM LIST.xlsx');

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Start from row 3 (index 2) as per previous analysis
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }) as any[][];

        console.log(`Found ${data.length} rows to process.`);

        // Group by base product name
        const productGroups = new Map<string, { base?: any, uoms: any[] }>();

        function normalizeName(name: string): string {
            return name.replace(/\s+[GH]$/, '').trim();
        }

        for (const row of data) {
            if (!row || row.length === 0) continue;

            // Check indices based on previous inspection:
            // 0: empty
            // 1: PRODUCT NAME
            // 2: CATEGORY (Retail/Wholesale) - not used for grouping logic but good to know
            // 3: SPECIFICATION (Category)
            // 4: DESCRIPTION
            // 5: MANUFUCTURER (Supplier)
            // 6: CONTENT (QTY)
            // 7: UNIT (UOM)
            // 8: UNIT COST

            const rawName = row[1];
            if (!rawName) continue;

            const name = normalizeName(rawName);

            // Initialize group if not exists
            if (!productGroups.has(name)) {
                productGroups.set(name, { uoms: [] });
            }

            const group = productGroups.get(name)!;

            // "G" is Base, "H" is Additional UOM (Wholesale)
            if (rawName.endsWith(' G')) {
                group.base = row;
            } else if (rawName.endsWith(' H')) {
                group.uoms.push(row);
            } else {
                // Fallback: If no G/H suffix, treat as base
                if (!group.base) group.base = row;
                else group.uoms.push(row);
            }
        }

        console.log(`Identified ${productGroups.size} unique products.`);

        for (const [productName, group] of productGroups) {
            if (!group.base) {
                console.warn(`No base record(G marker) found for product: ${productName}.Skipping.`);
                continue;
            }

            const baseRow = group.base;
            // Map columns
            const categoryName = baseRow[3] || 'Uncategorized';
            const manufacturerName = baseRow[5] || 'Unknown Supplier';
            const baseUomName = baseRow[7] || 'UNIT';
            const costPrice = parseFloat(baseRow[8]) || 0;
            const description = baseRow[4] || '';
            const contentQty = baseRow[6] || ''; // Use for description enhancement

            // 1. Supplier
            let supplier = await prisma.supplier.findFirst({
                where: { companyName: manufacturerName }
            });

            if (!supplier) {
                supplier = await prisma.supplier.create({
                    data: {
                        id: crypto.randomUUID(),
                        companyName: manufacturerName,
                        contactPerson: 'TBD',
                        phone: 'TBD',
                        paymentTerms: 'COD',
                        updatedAt: new Date()
                    }
                });
                console.log(`Created Supplier: ${manufacturerName} `);
            }

            // 2. Product Category
            let category = await prisma.productCategory.findFirst({
                where: { name: categoryName }
            });

            if (!category) {
                // Generate a simple code from name
                const code = categoryName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) + Math.floor(Math.random() * 1000);

                category = await prisma.productCategory.create({
                    data: {
                        name: categoryName,
                        code: code,
                        updatedAt: new Date()
                    }
                });
                console.log(`Created Category: ${categoryName} `);
            }

            // 3. Unit Of Measure (Base)
            // Only create if not exists, but we don't strictly link it via FK yet (Product stores UOM as string in baseUOM currently)
            // But user asked to sync entities.
            await ensureUomExists(baseUomName);


            // 4. Product Upsert
            // Generate ID deterministically or use random for new
            // We check by name
            let product = await prisma.product.findUnique({
                where: { name: productName }
            });

            const productData = {
                name: productName,
                description: description + (contentQty ? ` (${contentQty})` : ''),
                category: categoryName, // Keep the string field for now to avoid breaking existing logic
                productCategoryId: category.id,
                supplierId: supplier.id,
                imageUrl: '',
                basePrice: costPrice, // Placeholder as agreed
                baseUOM: baseUomName,
                minStockLevel: 10,
                shelfLifeDays: 365,
                averageCostPrice: costPrice,
                updatedAt: new Date()
            };

            if (product) {
                product = await prisma.product.update({
                    where: { id: product.id },
                    data: productData
                });
                console.log(`Updated Product: ${productName} `);
            } else {
                product = await prisma.product.create({
                    data: {
                        id: crypto.randomUUID(),
                        ...productData
                    }
                });
                console.log(`Created Product: ${productName} `);
            }

            // 5. Additional UOMs (H records)
            for (const uomRow of group.uoms) {
                const uomName = uomRow[7];
                const contentStr = (uomRow[6] || "") as string; // e.g., "48 CANS/BOX"
                const uomCost = parseFloat(uomRow[8]) || 0;

                if (!uomName) continue;

                // Try to parse conversion factor
                let conversionFactor = 1;
                // Simple regex to find the first number in the string
                const match = contentStr.toString().match(/^(\d+)/);
                if (match) {
                    conversionFactor = parseInt(match[1], 10);
                }

                await ensureUomExists(uomName);

                // Create/Update ProductUOM
                // Composite key is productId + name
                // Check if exists
                const existingUom = await prisma.productUOM.findUnique({
                    where: {
                        productId_name: {
                            productId: product.id,
                            name: uomName
                        }
                    }
                });

                if (existingUom) {
                    await prisma.productUOM.update({
                        where: { id: existingUom.id },
                        data: {
                            conversionFactor: conversionFactor,
                            sellingPrice: uomCost // using cost as selling price placeholder
                        }
                    });
                } else {
                    await prisma.productUOM.create({
                        data: {
                            id: crypto.randomUUID(),
                            productId: product.id,
                            name: uomName,
                            conversionFactor: conversionFactor,
                            sellingPrice: uomCost
                        }
                    });
                }
                console.log(`   > Added / Updated UOM: ${uomName} (Factor: ${conversionFactor}) for ${productName}`);
            }

        }
    } catch (error) {
        console.error('Error during import:', error);
        const fs = require('fs');
        fs.writeFileSync('error.json', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw error;
    }
}

async function ensureUomExists(uomName: string) {
    let uom = await prisma.unitOfMeasure.findUnique({
        where: { name: uomName }
    });

    if (!uom) {
        try {
            await prisma.unitOfMeasure.create({
                data: {
                    name: uomName,
                    code: uomName.toUpperCase().slice(0, 10), // Use name as code for simplicity
                    updatedAt: new Date()
                }
            });
            console.log(`Created UOM Entity: ${uomName} `);
        } catch (e) {
            console.warn(`Could not create UOM ${uomName}, it might exist with different casing or code.`);
        }
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
