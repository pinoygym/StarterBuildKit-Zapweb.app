// @ts-nocheck
import { PrismaClient } from '@prisma/client';

// Define permission resources and actions as constants
const PermissionResource = {
  USERS: 'USERS',
  ROLES: 'ROLES',
  PRODUCTS: 'PRODUCTS',
  INVENTORY: 'INVENTORY',
  SALES: 'SALES',
  PURCHASES: 'PURCHASES',
  CUSTOMERS: 'CUSTOMERS',
  SUPPLIERS: 'SUPPLIERS',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  ACCOUNTING: 'ACCOUNTING',
  BRANCHES: 'BRANCHES',
} as const;

const PermissionAction = {
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MANAGE: 'MANAGE',
} as const;

const prisma = new PrismaClient();

export async function seedRolePermissions() {
  console.log('Seeding role permissions...');

  // Get all roles
  const superAdmin = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  const branchManager = await prisma.role.findUnique({ where: { name: 'Branch Manager' } });
  const cashier = await prisma.role.findUnique({ where: { name: 'Cashier' } });
  const warehouseStaff = await prisma.role.findUnique({ where: { name: 'Warehouse Staff' } });
  const accountant = await prisma.role.findUnique({ where: { name: 'Accountant' } });

  if (!superAdmin || !branchManager || !cashier || !warehouseStaff || !accountant) {
    throw new Error('Roles not found. Please run seed roles first.');
  }

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();

  // Clear existing role permissions
  await prisma.rolePermission.deleteMany({});

  // Helper function to assign permissions
  async function assignPermissions(roleId: string, permissionIds: string[]) {
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.create({
        data: { roleId, permissionId },
      });
    }
  }

  // Super Admin - All permissions
  await assignPermissions(
    superAdmin.id,
    allPermissions.map(p => p.id)
  );

  // Branch Manager permissions
  const branchManagerPerms = allPermissions.filter(p => {
    if (p.resource === PermissionResource.PRODUCTS) {
      return p.action === PermissionAction.READ || p.action === PermissionAction.CREATE || p.action === PermissionAction.UPDATE;
    }
    if (p.resource === PermissionResource.INVENTORY) {
      return true; // All inventory actions
    }
    if (p.resource === PermissionResource.SALES) {
      return true; // All sales actions
    }
    if (p.resource === PermissionResource.PURCHASES) {
      return true; // All purchase actions
    }
    if (p.resource === PermissionResource.ACCOUNTING) {
      return p.action === PermissionAction.READ || p.action === PermissionAction.CREATE || p.action === PermissionAction.UPDATE;
    }
    if (p.resource === PermissionResource.REPORTS) {
      return p.action === PermissionAction.READ;
    }
    if (p.resource === PermissionResource.USERS) {
      return p.action === PermissionAction.READ || p.action === PermissionAction.CREATE || p.action === PermissionAction.UPDATE;
    }
    return false;
  });
  await assignPermissions(branchManager.id, branchManagerPerms.map(p => p.id));

  // Cashier permissions
  const cashierPerms = allPermissions.filter(p => {
    if (p.resource === PermissionResource.PRODUCTS && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.SALES && (p.action === PermissionAction.READ || p.action === PermissionAction.CREATE)) return true;
    if (p.resource === PermissionResource.INVENTORY && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.ACCOUNTING && p.action === PermissionAction.READ) return true;
    return false;
  });
  await assignPermissions(cashier.id, cashierPerms.map(p => p.id));

  // Warehouse Staff permissions
  const warehousePerms = allPermissions.filter(p => {
    if (p.resource === PermissionResource.PRODUCTS && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.INVENTORY && p.action !== PermissionAction.MANAGE) return true;
    if (p.resource === PermissionResource.PURCHASES && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.SALES && p.action === PermissionAction.READ) return true;
    return false;
  });
  await assignPermissions(warehouseStaff.id, warehousePerms.map(p => p.id));

  // Accountant permissions
  const accountantPerms = allPermissions.filter(p => {
    if (p.resource === PermissionResource.ACCOUNTING) return true;
    if (p.resource === PermissionResource.REPORTS) return true;
    if (p.resource === PermissionResource.SALES && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.PURCHASES && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.PRODUCTS && p.action === PermissionAction.READ) return true;
    if (p.resource === PermissionResource.INVENTORY && p.action === PermissionAction.READ) return true;
    return false;
  });
  await assignPermissions(accountant.id, accountantPerms.map(p => p.id));

  const totalAssigned = await prisma.rolePermission.count();
  console.log(`Assigned ${totalAssigned} permissions to roles`);
}
