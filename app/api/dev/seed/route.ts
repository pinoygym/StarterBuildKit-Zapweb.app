import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Forbidden in production' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    // Branches
    const branchMain = await prisma.branch.upsert({
      where: { code: 'MNL-001' },
      update: { updatedAt: new Date() },
      create: {
        id: randomUUID(),
        name: 'Manila Main Branch',
        code: 'MNL-001',
        location: '123 Rizal Avenue, Manila',
        manager: 'Juan Dela Cruz',
        phone: '+63 2 1234 5678',
        status: 'active',
        updatedAt: new Date(),
      },
    })

    const branchQC = await prisma.branch.upsert({
      where: { code: 'QC-001' },
      update: { updatedAt: new Date() },
      create: {
        id: randomUUID(),
        name: 'Quezon City Branch',
        code: 'QC-001',
        location: '456 Commonwealth Avenue, Quezon City',
        manager: 'Maria Santos',
        phone: '+63 2 8765 4321',
        status: 'active',
        updatedAt: new Date(),
      },
    })

    // Warehouses
    let whManila = await prisma.warehouse.findFirst({ where: { name: 'Manila Central Warehouse', branchId: branchMain.id } })
    if (whManila) {
      whManila = await prisma.warehouse.update({ where: { id: whManila.id }, data: { updatedAt: new Date() } })
    } else {
      whManila = await prisma.warehouse.create({
        data: {
          id: randomUUID(),
          name: 'Manila Central Warehouse',
          location: '789 Port Area, Manila',
          manager: 'Pedro Garcia',
          maxCapacity: 100000,
          branchId: branchMain.id,
          updatedAt: new Date(),
        },
      })
    }

    let whQC = await prisma.warehouse.findFirst({ where: { name: 'QC Storage Facility', branchId: branchQC.id } })
    if (whQC) {
      whQC = await prisma.warehouse.update({ where: { id: whQC.id }, data: { updatedAt: new Date() } })
    } else {
      whQC = await prisma.warehouse.create({
        data: {
          id: randomUUID(),
          name: 'QC Storage Facility',
          location: '321 Mindanao Avenue, Quezon City',
          manager: 'Ana Reyes',
          maxCapacity: 75000,
          branchId: branchQC.id,
          updatedAt: new Date(),
        },
      })
    }

    // Supplier
    let supplier = await prisma.supplier.findFirst({ where: { companyName: 'Absolute Beverage Supply' } })
    if (supplier) {
      supplier = await prisma.supplier.update({ where: { id: supplier.id }, data: { status: 'active', updatedAt: new Date() } })
    } else {
      supplier = await prisma.supplier.create({
        data: {
          id: randomUUID(),
          companyName: 'Absolute Beverage Supply',
          contactPerson: 'Carlos D.',
          phone: '+63 917 555 1212',
          email: 'absupply@example.com',
          paymentTerms: 'Net 30',
          status: 'active',
          updatedAt: new Date(),
        },
      })
    }

    // Products
    let pWater = await prisma.product.findFirst({ where: { name: 'Absolute 500ml Bottle' } })
    if (pWater) {
      pWater = await prisma.product.update({ where: { id: pWater.id }, data: { updatedAt: new Date() } })
    } else {
      pWater = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: 'Absolute 500ml Bottle',
          description: 'Purified distilled water 500ml',
          category: 'Water',
          baseUOM: 'bottle',
          basePrice: 15,
          minStockLevel: 600,
          shelfLifeDays: 730,
          status: 'active',
          updatedAt: new Date(),
        },
      })
    }

    let pSoda = await prisma.product.findFirst({ where: { name: 'Soda 12oz Can' } })
    if (pSoda) {
      pSoda = await prisma.product.update({ where: { id: pSoda.id }, data: { updatedAt: new Date() } })
    } else {
      pSoda = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: 'Soda 12oz Can',
          description: 'Carbonated drink 12oz can',
          category: 'Carbonated',
          baseUOM: 'can',
          basePrice: 18,
          minStockLevel: 500,
          shelfLifeDays: 540,
          status: 'active',
          updatedAt: new Date(),
        },
      })
    }

    // Inventory Batches
    const now = new Date()
    const expiryFar = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000)

    await prisma.inventoryBatch.createMany({
      data: [
        {
          id: randomUUID(),
          batchNumber: `BATCH-${Date.now()}-A1`,
          productId: pWater.id,
          warehouseId: whManila.id,
          quantity: 1000,
          unitCost: 12,
          expiryDate: expiryFar,
          receivedDate: now,
          status: 'active',
          updatedAt: now,
        },
        {
          id: randomUUID(),
          batchNumber: `BATCH-${Date.now()}-A2`,
          productId: pWater.id,
          warehouseId: whQC.id,
          quantity: 750,
          unitCost: 12,
          expiryDate: expiryFar,
          receivedDate: now,
          status: 'active',
          updatedAt: now,
        },
        {
          id: randomUUID(),
          batchNumber: `BATCH-${Date.now()}-S1`,
          productId: pSoda.id,
          warehouseId: whManila.id,
          quantity: 800,
          unitCost: 14,
          expiryDate: expiryFar,
          receivedDate: now,
          status: 'active',
          updatedAt: now,
        },
      ],
    })

    // Role and permissions
    const roleAdmin = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: { updatedAt: new Date() },
      create: { id: randomUUID(), name: 'Admin', description: 'Admin role', updatedAt: new Date() },
    })

    const permUserRead = await prisma.permission.upsert({
      where: { resource_action: { resource: 'USER', action: 'READ' } },
      update: {},
      create: { id: randomUUID(), resource: 'USER', action: 'READ', description: 'Read users' },
    })

    const permInvRead = await prisma.permission.upsert({
      where: { resource_action: { resource: 'INVENTORY', action: 'READ' } },
      update: {},
      create: { id: randomUUID(), resource: 'INVENTORY', action: 'READ', description: 'Read inventory' },
    })

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: permUserRead.id } },
      update: {},
      create: { id: randomUUID(), roleId: roleAdmin.id, permissionId: permUserRead.id },
    })

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: permInvRead.id } },
      update: {},
      create: { id: randomUUID(), roleId: roleAdmin.id, permissionId: permInvRead.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        branches: [branchMain, branchQC],
        warehouses: [whManila, whQC],
        supplier,
        products: [pWater, pSoda],
        role: roleAdmin,
        permissions: [permUserRead, permInvRead],
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: String(error?.message || 'Seed error') }, { status: 500 })
  }
}