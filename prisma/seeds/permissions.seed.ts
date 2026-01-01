import { PrismaClient, PermissionResource, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log('Seeding permissions...');

  const permissions = [
    // Users permissions
    { resource: PermissionResource.USERS, action: PermissionAction.READ, description: 'View user information' },
    { resource: PermissionResource.USERS, action: PermissionAction.CREATE, description: 'Create new users' },
    { resource: PermissionResource.USERS, action: PermissionAction.UPDATE, description: 'Update user information' },
    { resource: PermissionResource.USERS, action: PermissionAction.DELETE, description: 'Delete users' },
    { resource: PermissionResource.USERS, action: PermissionAction.MANAGE, description: 'Full user management access' },

    // Roles permissions
    { resource: PermissionResource.ROLES, action: PermissionAction.READ, description: 'View roles and permissions' },
    { resource: PermissionResource.ROLES, action: PermissionAction.CREATE, description: 'Create new roles' },
    { resource: PermissionResource.ROLES, action: PermissionAction.UPDATE, description: 'Update roles and assign permissions' },
    { resource: PermissionResource.ROLES, action: PermissionAction.DELETE, description: 'Delete roles' },
    { resource: PermissionResource.ROLES, action: PermissionAction.MANAGE, description: 'Full role management access' },

    // Products permissions
    { resource: PermissionResource.PRODUCTS, action: PermissionAction.READ, description: 'View product catalog' },
    { resource: PermissionResource.PRODUCTS, action: PermissionAction.CREATE, description: 'Create new products' },
    { resource: PermissionResource.PRODUCTS, action: PermissionAction.UPDATE, description: 'Update product information' },
    { resource: PermissionResource.PRODUCTS, action: PermissionAction.DELETE, description: 'Delete products' },
    { resource: PermissionResource.PRODUCTS, action: PermissionAction.MANAGE, description: 'Full product management access' },

    // Inventory permissions
    { resource: PermissionResource.INVENTORY, action: PermissionAction.READ, description: 'View inventory levels' },
    { resource: PermissionResource.INVENTORY, action: PermissionAction.CREATE, description: 'Add new inventory batches' },
    { resource: PermissionResource.INVENTORY, action: PermissionAction.UPDATE, description: 'Adjust inventory levels' },
    { resource: PermissionResource.INVENTORY, action: PermissionAction.DELETE, description: 'Remove inventory batches' },
    { resource: PermissionResource.INVENTORY, action: PermissionAction.MANAGE, description: 'Full inventory management access' },

    // Sales permissions
    { resource: PermissionResource.SALES, action: PermissionAction.READ, description: 'View sales orders and POS transactions' },
    { resource: PermissionResource.SALES, action: PermissionAction.CREATE, description: 'Create sales orders and POS sales' },
    { resource: PermissionResource.SALES, action: PermissionAction.UPDATE, description: 'Update sales orders' },
    { resource: PermissionResource.SALES, action: PermissionAction.DELETE, description: 'Delete sales orders' },
    { resource: PermissionResource.SALES, action: PermissionAction.MANAGE, description: 'Full sales management access' },

    // Purchases permissions
    { resource: PermissionResource.PURCHASES, action: PermissionAction.READ, description: 'View purchase orders' },
    { resource: PermissionResource.PURCHASES, action: PermissionAction.CREATE, description: 'Create purchase orders' },
    { resource: PermissionResource.PURCHASES, action: PermissionAction.UPDATE, description: 'Update purchase orders' },
    { resource: PermissionResource.PURCHASES, action: PermissionAction.DELETE, description: 'Delete purchase orders' },
    { resource: PermissionResource.PURCHASES, action: PermissionAction.MANAGE, description: 'Full purchase management access' },

    // Accounting permissions
    { resource: PermissionResource.ACCOUNTING, action: PermissionAction.READ, description: 'View AR/AP and expenses' },
    { resource: PermissionResource.ACCOUNTING, action: PermissionAction.CREATE, description: 'Create AR/AP entries and expenses' },
    { resource: PermissionResource.ACCOUNTING, action: PermissionAction.UPDATE, description: 'Update AR/AP and expenses' },
    { resource: PermissionResource.ACCOUNTING, action: PermissionAction.DELETE, description: 'Delete AR/AP entries and expenses' },
    { resource: PermissionResource.ACCOUNTING, action: PermissionAction.MANAGE, description: 'Full accounting access' },

    // Reports permissions
    { resource: PermissionResource.REPORTS, action: PermissionAction.READ, description: 'View reports and analytics' },
    { resource: PermissionResource.REPORTS, action: PermissionAction.MANAGE, description: 'Generate and export reports' },

    // Branches permissions
    { resource: PermissionResource.BRANCHES, action: PermissionAction.READ, description: 'View branch information' },
    { resource: PermissionResource.BRANCHES, action: PermissionAction.CREATE, description: 'Create new branches' },
    { resource: PermissionResource.BRANCHES, action: PermissionAction.UPDATE, description: 'Update branch information' },
    { resource: PermissionResource.BRANCHES, action: PermissionAction.DELETE, description: 'Delete branches' },
    { resource: PermissionResource.BRANCHES, action: PermissionAction.MANAGE, description: 'Full branch management access' },

    // Settings permissions
    { resource: PermissionResource.SETTINGS, action: PermissionAction.READ, description: 'View system settings' },
    { resource: PermissionResource.SETTINGS, action: PermissionAction.UPDATE, description: 'Update system settings' },
    { resource: PermissionResource.SETTINGS, action: PermissionAction.MANAGE, description: 'Full system configuration access' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permission.resource,
          action: permission.action,
        },
      },
      update: {},
      create: permission,
    });
  }

  console.log(`Created ${permissions.length} permissions`);
}
