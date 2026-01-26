import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Target: Production
const PROD_DB_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Source: Passed as argument
const SOURCE_DB_URL = process.argv[2];

if (!SOURCE_DB_URL) {
    console.error('Please provide the Source Database URL as the first argument.');
    console.error('Usage: npx tsx scripts/sync-custom-source-to-prod.ts <SOURCE_DB_URL>');
    process.exit(1);
}

// 1. Instantiate Prod Client (Target)
const poolProd = new Pool({ connectionString: PROD_DB_URL });
const adapterProd = new PrismaPg(poolProd);
const prismaProd = new PrismaClient({ adapter: adapterProd });

// 2. Instantiate Source Client
const poolSource = new Pool({ connectionString: SOURCE_DB_URL });
const adapterSource = new PrismaPg(poolSource);
const prismaSource = new PrismaClient({ adapter: adapterSource });

const sourceToProdRoleMap: Record<string, string> = {};
const sourceToProdBranchMap: Record<string, string> = {};
const sourceToProdUserMap: Record<string, string> = {};
const sourceToProdProductMap: Record<string, string> = {};
const sourceToProdWarehouseMap: Record<string, string> = {};

async function main() {
    console.log('Starting sync from Custom Source to PROD...');
    console.log('Source URL:', SOURCE_DB_URL.substring(0, 30) + '...');

    try {
        // Check Connection and Counts
        const sourceUserCount = await prismaSource.user.count();
        console.log(`Source Users: ${sourceUserCount}`);

        if (sourceUserCount === 0) {
            console.log('Warning: Source database has 0 users.');
        }

        // 1. Sync Roles
        console.log('Fetching Roles from Source...');
        const roles = await prismaSource.role.findMany();
        console.log(`Found ${roles.length} roles.`);
        for (const role of roles) {
            const upsertedRole = await prismaProd.role.upsert({
                where: { name: role.name },
                update: {
                    description: role.description,
                    isSystem: role.isSystem,
                    updatedAt: new Date(),
                },
                create: {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    isSystem: role.isSystem,
                    createdAt: role.createdAt,
                    updatedAt: new Date(),
                },
            });
            sourceToProdRoleMap[role.id] = upsertedRole.id;
        }
        console.log('Roles synced.');

        // 2. Sync Branches
        console.log('Fetching Branches from Source...');
        const branches = await prismaSource.branch.findMany();
        console.log(`Found ${branches.length} branches.`);
        for (const branch of branches) {
            const upsertedBranch = await prismaProd.branch.upsert({
                where: { code: branch.code },
                update: {
                    name: branch.name,
                    location: branch.location,
                    manager: branch.manager,
                    phone: branch.phone,
                    status: branch.status,
                    updatedAt: new Date(),
                },
                create: {
                    id: branch.id,
                    name: branch.name,
                    code: branch.code,
                    location: branch.location,
                    manager: branch.manager,
                    phone: branch.phone,
                    status: branch.status,
                    createdAt: branch.createdAt,
                    updatedAt: new Date(),
                },
            });
            sourceToProdBranchMap[branch.id] = upsertedBranch.id;
        }
        console.log('Branches synced.');

        // 3. Sync Users
        console.log('Fetching Users from Source...');
        const users = await prismaSource.user.findMany();
        console.log(`Found ${users.length} users.`);
        for (const user of users) {
            console.log(`Syncing user: ${user.email}`);

            const prodRoleId = sourceToProdRoleMap[user.roleId];
            if (!prodRoleId) {
                console.warn(`Warning: Role with ID ${user.roleId} not found in Production for user ${user.email}. Skipping user.`);
                continue;
            }

            let prodBranchId = user.branchId ? sourceToProdBranchMap[user.branchId] : null;
            if (user.branchId && !prodBranchId) {
                console.warn(`Warning: Branch with ID ${user.branchId} not found in Production for user ${user.email}. Setting branchId to null.`);
                prodBranchId = null;
            }

            const upsertedUser = await prismaProd.user.upsert({
                where: { email: user.email },
                update: {
                    passwordHash: user.passwordHash,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    roleId: prodRoleId,
                    branchId: prodBranchId,
                    status: user.status,
                    emailVerified: user.emailVerified,
                    isSuperMegaAdmin: user.isSuperMegaAdmin,
                    lastLoginAt: user.lastLoginAt,
                    passwordChangedAt: user.passwordChangedAt,
                    branchLockEnabled: user.branchLockEnabled,
                    updatedAt: new Date(),
                },
                create: {
                    id: user.id,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    roleId: prodRoleId,
                    branchId: prodBranchId,
                    status: user.status,
                    emailVerified: user.emailVerified,
                    isSuperMegaAdmin: user.isSuperMegaAdmin,
                    lastLoginAt: user.lastLoginAt,
                    passwordChangedAt: user.passwordChangedAt,
                    branchLockEnabled: user.branchLockEnabled,
                    createdAt: user.createdAt,
                    updatedAt: new Date(),
                },
            });
            sourceToProdUserMap[user.id] = upsertedUser.id;
        }
        console.log('Users synced.');

        // 4. Sync UserBranchAccess
        console.log('Fetching UserBranchAccess from Source...');
        const accesses = await prismaSource.userBranchAccess.findMany();
        console.log(`Found ${accesses.length} user branch access records.`);
        for (const access of accesses) {
            const prodUserId = sourceToProdUserMap[access.userId];
            const prodBranchId = sourceToProdBranchMap[access.branchId];

            if (!prodUserId || !prodBranchId) {
                // Optional: console.warn(`Skipping...`);
                continue;
            }

            await prismaProd.userBranchAccess.upsert({
                where: { id: access.id },
                update: {
                    userId: prodUserId,
                    branchId: prodBranchId,
                },
                create: {
                    id: access.id,
                    userId: prodUserId,
                    branchId: prodBranchId,
                    createdAt: access.createdAt,
                },
            });
        }
        console.log('UserBranchAccess synced.');

        // 5. Sync Reference Data (ProductCategory, UnitOfMeasure)
        console.log('Fetching ProductCategory from Source...');
        const categories = await prismaSource.productCategory.findMany();
        console.log(`Found ${categories.length} product categories.`);
        for (const cat of categories) {
            await prismaProd.productCategory.upsert({
                where: { name: cat.name },
                update: {
                    code: cat.code,
                    description: cat.description,
                    status: cat.status,
                    displayOrder: cat.displayOrder,
                    isSystemDefined: cat.isSystemDefined,
                    updatedAt: new Date(),
                },
                create: {
                    id: cat.id,
                    name: cat.name,
                    code: cat.code,
                    description: cat.description,
                    status: cat.status,
                    displayOrder: cat.displayOrder,
                    isSystemDefined: cat.isSystemDefined,
                    createdAt: cat.createdAt,
                    updatedAt: new Date(),
                },
            });
        }
        console.log('ProductCategories synced.');

        console.log('Fetching UnitOfMeasure from Source...');
        const uoms = await prismaSource.unitOfMeasure.findMany();
        console.log(`Found ${uoms.length} UOMs.`);
        for (const uom of uoms) {
            await prismaProd.unitOfMeasure.upsert({
                where: { name: uom.name },
                update: {
                    code: uom.code,
                    description: uom.description,
                    status: uom.status,
                    displayOrder: uom.displayOrder,
                    isSystemDefined: uom.isSystemDefined,
                    updatedAt: new Date(),
                },
                create: {
                    id: uom.id,
                    name: uom.name,
                    code: uom.code,
                    description: uom.description,
                    status: uom.status,
                    displayOrder: uom.displayOrder,
                    isSystemDefined: uom.isSystemDefined,
                    createdAt: uom.createdAt,
                    updatedAt: new Date(),
                },
            });
        }
        console.log('UnitOfMeasures synced.');

        // 6. Sync Products
        console.log('Fetching Products from Source...');
        const products = await prismaSource.product.findMany();
        console.log(`Found ${products.length} products.`);
        for (const product of products) {
            const upsertedProduct = await prismaProd.product.upsert({
                where: { name: product.name },
                update: {
                    description: product.description,
                    category: product.category,
                    imageUrl: product.imageUrl,
                    basePrice: product.basePrice,
                    baseUOM: product.baseUOM,
                    minStockLevel: product.minStockLevel,
                    shelfLifeDays: product.shelfLifeDays,
                    status: product.status,
                    averageCostPrice: product.averageCostPrice,
                    updatedAt: new Date(),
                },
                create: {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    imageUrl: product.imageUrl,
                    basePrice: product.basePrice,
                    baseUOM: product.baseUOM,
                    minStockLevel: product.minStockLevel,
                    shelfLifeDays: product.shelfLifeDays,
                    status: product.status,
                    averageCostPrice: product.averageCostPrice,
                    createdAt: product.createdAt,
                    updatedAt: new Date(),
                },
            });
            sourceToProdProductMap[product.id] = upsertedProduct.id;
        }
        console.log('Products synced.');

        // 7. Sync ProductUOM
        console.log('Fetching ProductUOMs from Source...');
        const productUOMs = await prismaSource.productUOM.findMany();
        console.log(`Found ${productUOMs.length} ProductUOMs.`);
        for (const pUom of productUOMs) {
            const prodProductId = sourceToProdProductMap[pUom.productId];
            if (!prodProductId) {
                console.warn(`Skipping ProductUOM ${pUom.name} because Product ${pUom.productId} was not synced.`);
                continue;
            }

            await prismaProd.productUOM.upsert({
                where: {
                    productId_name: {
                        productId: prodProductId,
                        name: pUom.name,
                    }
                },
                update: {
                    conversionFactor: pUom.conversionFactor,
                    sellingPrice: pUom.sellingPrice,
                },
                create: {
                    id: pUom.id,
                    productId: prodProductId,
                    name: pUom.name,
                    conversionFactor: pUom.conversionFactor,
                    sellingPrice: pUom.sellingPrice,
                    createdAt: pUom.createdAt,
                }
            });
        }
        console.log('ProductUOMs synced.');

        // 8. Sync Warehouses
        console.log('Fetching Warehouses from Source...');
        const warehouses = await prismaSource.warehouse.findMany();
        console.log(`Found ${warehouses.length} warehouses.`);
        for (const warehouse of warehouses) {
            const prodBranchId = sourceToProdBranchMap[warehouse.branchId];
            if (!prodBranchId) {
                console.warn(`Skipping Warehouse ${warehouse.name} because Branch ${warehouse.branchId} was not synced.`);
                continue;
            }

            const upsertedWarehouse = await prismaProd.warehouse.upsert({
                where: { id: warehouse.id },
                update: {
                    name: warehouse.name,
                    location: warehouse.location,
                    manager: warehouse.manager,
                    maxCapacity: warehouse.maxCapacity,
                    branchId: prodBranchId,
                    updatedAt: new Date(),
                },
                create: {
                    id: warehouse.id,
                    name: warehouse.name,
                    location: warehouse.location,
                    manager: warehouse.manager,
                    maxCapacity: warehouse.maxCapacity,
                    branchId: prodBranchId,
                    createdAt: warehouse.createdAt,
                    updatedAt: new Date(),
                }
            });
            sourceToProdWarehouseMap[warehouse.id] = upsertedWarehouse.id;
        }
        console.log('Warehouses synced.');

        // 9. Sync Inventory
        try {
            console.log('Fetching Inventory from Source...');
            const inventoryItems = await prismaSource.inventory.findMany();
            console.log(`Found ${inventoryItems.length} inventory items.`);

            for (const item of inventoryItems) {
                const prodProductId = sourceToProdProductMap[item.productId];
                const prodWarehouseId = sourceToProdWarehouseMap[item.warehouseId];

                if (!prodProductId || !prodWarehouseId) {
                    continue;
                }

                await prismaProd.inventory.upsert({
                    where: {
                        productId_warehouseId: {
                            productId: prodProductId,
                            warehouseId: prodWarehouseId
                        }
                    },
                    update: {
                        quantity: item.quantity,
                        updatedAt: new Date()
                    },
                    create: {
                        productId: prodProductId,
                        warehouseId: prodWarehouseId,
                        quantity: item.quantity,
                        createdAt: item.createdAt,
                        updatedAt: new Date()
                    }
                });
            }
            console.log('Inventory synced.');
        } catch (e) {
            console.log('Inventory sync skipped or failed (Model might differ in source/target).', e);
        }

        // 10. Sync Permissions
        console.log('Fetching Permissions from Source...');
        const permissions = await prismaSource.permission.findMany();
        console.log(`Found ${permissions.length} permissions.`);
        const sourceToProdPermissionMap: Record<string, string> = {};
        for (const perm of permissions) {
            const upsertedPerm = await prismaProd.permission.upsert({
                where: {
                    resource_action: {
                        resource: perm.resource,
                        action: perm.action
                    }
                },
                update: {
                    description: perm.description,
                },
                create: {
                    id: perm.id,
                    resource: perm.resource,
                    action: perm.action,
                    description: perm.description,
                    createdAt: perm.createdAt,
                }
            });
            sourceToProdPermissionMap[perm.id] = upsertedPerm.id;
        }
        console.log('Permissions synced.');

        // 11. Sync RolePermissions
        console.log('Fetching RolePermissions from Source...');
        const rolePermissions = await prismaSource.rolePermission.findMany();
        console.log(`Found ${rolePermissions.length} role permissions.`);
        for (const rp of rolePermissions) {
            const prodRoleId = sourceToProdRoleMap[rp.roleId];
            const prodPermissionId = sourceToProdPermissionMap[rp.permissionId];

            if (!prodRoleId || !prodPermissionId) {
                continue;
            }

            await prismaProd.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: prodRoleId,
                        permissionId: prodPermissionId
                    }
                },
                update: {},
                create: {
                    id: rp.id,
                    roleId: prodRoleId,
                    permissionId: prodPermissionId,
                    createdAt: rp.createdAt,
                }
            });
        }
        console.log('RolePermissions synced.');

        // 12. Sync Suppliers
        console.log('Fetching Suppliers from Source...');
        const suppliers = await prismaSource.supplier.findMany();
        console.log(`Found ${suppliers.length} suppliers.`);
        for (const supplier of suppliers) {
            await prismaProd.supplier.upsert({
                where: { id: supplier.id },
                update: {
                    companyName: supplier.companyName,
                    contactPerson: supplier.contactPerson,
                    phone: supplier.phone,
                    email: supplier.email,
                    paymentTerms: supplier.paymentTerms,
                    status: supplier.status,
                    updatedAt: new Date(),
                },
                create: {
                    id: supplier.id,
                    companyName: supplier.companyName,
                    contactPerson: supplier.contactPerson,
                    phone: supplier.phone,
                    email: supplier.email,
                    paymentTerms: supplier.paymentTerms,
                    status: supplier.status,
                    createdAt: supplier.createdAt,
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Suppliers synced.');

        // 13. Sync Customers
        console.log('Fetching Customers from Source...');
        const customers = await prismaSource.customer.findMany();
        console.log(`Found ${customers.length} customers.`);
        for (const customer of customers) {
            await prismaProd.customer.upsert({
                where: { customerCode: customer.customerCode },
                update: {
                    companyName: customer.companyName,
                    contactPerson: customer.contactPerson,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    city: customer.city,
                    region: customer.region,
                    postalCode: customer.postalCode,
                    paymentTerms: customer.paymentTerms,
                    creditLimit: customer.creditLimit,
                    taxId: customer.taxId,
                    customerType: customer.customerType,
                    notes: customer.notes,
                    status: customer.status,
                    updatedAt: new Date(),
                },
                create: {
                    id: customer.id,
                    customerCode: customer.customerCode,
                    companyName: customer.companyName,
                    contactPerson: customer.contactPerson,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    city: customer.city,
                    region: customer.region,
                    postalCode: customer.postalCode,
                    paymentTerms: customer.paymentTerms,
                    creditLimit: customer.creditLimit,
                    taxId: customer.taxId,
                    customerType: customer.customerType,
                    notes: customer.notes,
                    status: customer.status,
                    createdAt: customer.createdAt,
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Customers synced.');

        // 14. Sync Expense Categories
        console.log('Fetching ExpenseCategories from Source...');
        const expenseCategories = await prismaSource.expenseCategory.findMany();
        console.log(`Found ${expenseCategories.length} expense categories.`);
        for (const ec of expenseCategories) {
            await prismaProd.expenseCategory.upsert({
                where: { name: ec.name },
                update: {
                    code: ec.code,
                    description: ec.description,
                    status: ec.status,
                    displayOrder: ec.displayOrder,
                    isSystemDefined: ec.isSystemDefined,
                    updatedAt: new Date(),
                },
                create: {
                    id: ec.id,
                    name: ec.name,
                    code: ec.code,
                    description: ec.description,
                    status: ec.status,
                    displayOrder: ec.displayOrder,
                    isSystemDefined: ec.isSystemDefined,
                    createdAt: ec.createdAt,
                    updatedAt: new Date(),
                }
            });
        }
        console.log('ExpenseCategories synced.');

        // 15. Sync Expense Vendors
        console.log('Fetching ExpenseVendors from Source...');
        const expenseVendors = await prismaSource.expenseVendor.findMany();
        console.log(`Found ${expenseVendors.length} expense vendors.`);
        for (const ev of expenseVendors) {
            await prismaProd.expenseVendor.upsert({
                where: { name: ev.name },
                update: {
                    contactPerson: ev.contactPerson,
                    phone: ev.phone,
                    email: ev.email,
                    status: ev.status,
                    displayOrder: ev.displayOrder,
                    usageCount: ev.usageCount,
                    updatedAt: new Date(),
                },
                create: {
                    id: ev.id,
                    name: ev.name,
                    contactPerson: ev.contactPerson,
                    phone: ev.phone,
                    email: ev.email,
                    status: ev.status,
                    displayOrder: ev.displayOrder,
                    usageCount: ev.usageCount,
                    createdAt: ev.createdAt,
                    updatedAt: new Date(),
                }
            });
        }
        console.log('ExpenseVendors synced.');

        // 16. Sync Payment Methods
        console.log('Fetching PaymentMethods from Source...');
        const paymentMethods = await prismaSource.paymentMethod.findMany();
        console.log(`Found ${paymentMethods.length} payment methods.`);
        for (const pm of paymentMethods) {
            await prismaProd.paymentMethod.upsert({
                where: { name: pm.name },
                update: {
                    code: pm.code,
                    description: pm.description,
                    status: pm.status,
                    displayOrder: pm.displayOrder,
                    isSystemDefined: pm.isSystemDefined,
                    applicableTo: pm.applicableTo,
                    updatedAt: new Date(),
                },
                create: {
                    id: pm.id,
                    name: pm.name,
                    code: pm.code,
                    description: pm.description,
                    status: pm.status,
                    displayOrder: pm.displayOrder,
                    isSystemDefined: pm.isSystemDefined,
                    applicableTo: pm.applicableTo,
                    createdAt: pm.createdAt,
                    updatedAt: new Date(),
                }
            });
        }
        console.log('PaymentMethods synced.');

    } catch (error) {
        console.error('Error during sync:', error);
    } finally {
        await prismaProd.$disconnect();
        await prismaSource.$disconnect();
    }
}

main();