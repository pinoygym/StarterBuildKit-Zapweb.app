import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { userRepository } from '@/repositories/user.repository';
import { randomUUID } from 'crypto';

async function main() {
    console.log('--- Case Sensitivity Test ---');

    const email = 'MixedCase@Example.com';
    const lowerEmail = email.toLowerCase();

    // Cleanup first
    await prisma.user.deleteMany({ where: { email: { in: [email, lowerEmail] } } });

    // Create mixed case user
    const role = await prisma.role.findFirst();
    if (!role) throw new Error('No role found');

    await prisma.user.create({
        data: {
            id: randomUUID(),
            email: email,
            passwordHash: 'temp',
            firstName: 'Mixed',
            lastName: 'Case',
            roleId: role.id,
            status: 'ACTIVE',
            updatedAt: new Date()
        }
    });
    console.log(`Created user: ${email}`);

    // Try to exclude using lowercase
    console.log(`Excluding: ${lowerEmail}`);
    const result = await userRepository.findAll({ excludeEmail: lowerEmail });

    const found = result.data.find(u => u.email === email);
    console.log(`Found user in list? ${!!found}`);

    if (found) {
        console.log('CONFIRMED: Exclusion is case SENSITIVE. Uppercase email WAS NOT excluded by lowercase filter.');
    } else {
        console.log('DISPROVED: Exclusion is case INSENSITIVE (or user was not found for other reasons).');
    }

    // Cleanup
    await prisma.user.deleteMany({ where: { email: { in: [email, lowerEmail] } } });
}

main().finally(() => prisma.$disconnect());
