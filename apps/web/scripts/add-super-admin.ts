import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

async function main() {
    const email = 'cybergada@gmail.com';
    const password = 'Qweasd1234';
    const firstName = 'Cyber';
    const lastName = 'Gada';

    console.log(`Ensuring super admin user: ${email}`);

    // 1. Get or Create Super Admin role
    let superAdminRole = await prisma.role.findUnique({
        where: { name: 'Super Admin' },
    });

    if (!superAdminRole) {
        console.log('Super Admin role not found, creating...');
        superAdminRole = await prisma.role.create({
            data: {
                id: crypto.randomUUID(),
                name: 'Super Admin',
                description: 'Super administrator with full system access',
                isSystem: true,
                updatedAt: new Date(),
            },
        });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Upsert user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            status: 'ACTIVE',
            emailVerified: true,
            roleId: superAdminRole.id,
            updatedAt: new Date(),
        },
        create: {
            id: crypto.randomUUID(),
            email,
            passwordHash,
            firstName,
            lastName,
            roleId: superAdminRole.id,
            status: 'ACTIVE',
            emailVerified: true,
            isSuperMegaAdmin: true,
            updatedAt: new Date(),
        },
    });

    console.log('✅ Super admin user ensured successfully:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: Super Admin`);
}

main()
    .catch((e) => {
        console.error('Error ensuring super admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
