import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Forbidden in production' }, { status: 403 })
    }

    const { email, password, firstName, lastName } = await request.json().catch(() => ({}))
    const userEmail = email || 'demo@example.com'
    const userPassword = password || 'Password123!'
    const f = firstName || 'Demo'
    const l = lastName || 'User'

  let role = await prisma.role.findFirst({ where: { name: 'Admin' } })
  if (!role) {
    role = await prisma.role.create({
      data: { id: randomUUID(), name: 'Admin', description: 'Admin role', updatedAt: new Date() }
    })
  }

    // Ensure a sample permission exists and is assigned to the Admin role
    let perm = await prisma.permission.findFirst({ where: { resource: 'USER', action: 'READ' } })
    if (!perm) {
      perm = await prisma.permission.create({
        data: { id: randomUUID(), resource: 'USER', action: 'READ', description: 'Read users' }
      })
    }
    const rpExists = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } }
    })
    if (!rpExists) {
      await prisma.rolePermission.create({
        data: { id: randomUUID(), roleId: role.id, permissionId: perm.id }
      })
    }

    const existing = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: true, status: 'ACTIVE', Role: { connect: { id: role.id } }, updatedAt: new Date() }
      })
      return NextResponse.json({ success: true, userId: existing.id, roleId: role.id, message: 'User updated' }, { status: 200 })
    }

    const hash = await bcrypt.hash(userPassword, 12)
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: userEmail,
        passwordHash: hash,
        firstName: f,
        lastName: l,
        emailVerified: true,
        status: 'ACTIVE',
        updatedAt: new Date(),
        Role: { connect: { id: role.id } },
      }
    })

    return NextResponse.json({ success: true, userId: user.id, roleId: role.id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: String(error?.message || 'Seed error') }, { status: 500 })
  }
}