import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // Removed

export async function seedUsers(prisma: PrismaClient) {
    console.log('Seeding users from JSON...');

    // 1. Get valid Branch ID
    const branch = await prisma.branch.findFirst({
        where: { code: 'MNL-001' }
    });

    if (!branch) {
        console.error('Branch MNL-001 not found. Please seed branches first.');
        return;
    }

    // 2. Get valid Role IDs
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
    const cashierRole = await prisma.role.findUnique({ where: { name: 'Cashier' } });

    if (!superAdminRole || !cashierRole) {
        console.error('Roles not found. Please seed roles first.');
        return;
    }

    const users = [
        { "id": "319c2940-80c9-4143-97de-34060a2049b7", "email": "velmbautista@gmail.com", "passwordHash": "$2b$12$keHXnUIpGypW3wwb5tNtb.4vFLYec.STe8DEcxDj3Ghq5KHIY/oOe", "firstName": "Vel", "lastName": "Bau", "phone": "", "roleId": "cmi7oyndp001bvaecyykj14uc", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-21 06:19:34.104", "passwordChangedAt": null, "createdAt": "2025-11-21 06:17:42.969", "updatedAt": "2025-11-22 09:41:12.052", "branchLockEnabled": false },
        { "id": "4112b97b-aeb5-4b86-908f-0f31e5a9f8ef", "email": "mendozaea7@gmail.com", "passwordHash": "$2b$12$RsVItPawpmsouZ1TSjN4lO3l/oRdh/aWPros/fr23E.30VW4QOViC", "firstName": "Ethel", "lastName": "Mendoza", "phone": "", "roleId": "cmi7oymq60019vaec0v4jbugm", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-25 11:38:06.85", "passwordChangedAt": null, "createdAt": "2025-11-22 00:23:56.405", "updatedAt": "2025-11-25 11:38:06.851", "branchLockEnabled": false },
        { "id": "93ba98ba-5ab6-476c-9138-e6efe8a424c0", "email": "lancemendoza360@gmail.com", "passwordHash": "$2b$12$um9T6IZCC6ZsbWG/hQ3ph.75SY3wgNaWfeW4f1EWH3uQ85CslwK6K", "firstName": "Lance", "lastName": "Mendoza", "phone": "", "roleId": "cmi7oymq60019vaec0v4jbugm", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-22 02:24:03.023", "passwordChangedAt": null, "createdAt": "2025-11-22 02:22:15.559", "updatedAt": "2025-11-22 03:43:10.833", "branchLockEnabled": false },
        { "id": "9de2e837-a5a3-4295-a077-9efe10a8a7ac", "email": "pinoygym@gmail.com", "passwordHash": "$2b$12$.Fdxg6poP/3MD2GQUwDtNe6lOW3bxBpSXXSUEopbTP076W0pNuI.2", "firstName": "eee", "lastName": "eee", "phone": "", "roleId": "cmi7oyndp001bvaecyykj14uc", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-22 13:12:22.775", "passwordChangedAt": null, "createdAt": "2025-11-21 04:49:18.686", "updatedAt": "2025-11-22 13:12:22.776", "branchLockEnabled": false },
        { "id": "bb58872b-7a81-4c16-a751-6d697e15713a", "email": "teamwebplus@gmail.com", "passwordHash": "$2b$12$Xd8aj5OzMz2Qux6UniEaaOI2GNwVWO3iiqbA0QS5zmDwI3scUThIK", "firstName": "aaa", "lastName": "Gada", "phone": "", "roleId": "cmi7oymq60019vaec0v4jbugm", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-22 16:16:03.231", "passwordChangedAt": null, "createdAt": "2025-11-21 06:00:05.674", "updatedAt": "2025-11-22 16:16:03.232", "branchLockEnabled": false },
        { "id": "cmi7p01tn006lvaagodio7w23", "email": "cybergada@gmail.com", "passwordHash": "$2b$12$g7jFAbb7rlwhK0dEnFxp6exrqioLmpAtT/hjEyTdD5pCxsHdtQv62", "firstName": "Cyber", "lastName": "Gada", "phone": "", "roleId": "cmi7oymq60019vaec0v4jbugm", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": "2025-11-25 10:05:45.292", "passwordChangedAt": null, "createdAt": "2025-11-20 17:15:48.155", "updatedAt": "2025-11-25 10:05:45.293", "branchLockEnabled": false },
        { "id": "cmi9zaqz30000var8h3kt6zu8", "email": "aaaa@gmail.com", "passwordHash": "$2b$12$v2fxX5w8hNoVXmAcRCk5qOe7yOIAiu6AH8QuCbQbxV4WyyExkJ9Ba", "firstName": "aaa", "lastName": "aaa", "phone": "", "roleId": "cmi7oyndp001bvaecyykj14uc", "branchId": "cmi9kluws0000jl04vhodelfo", "status": "ACTIVE", "emailVerified": true, "lastLoginAt": null, "passwordChangedAt": null, "createdAt": "2025-11-22 07:39:35.823", "updatedAt": "2025-11-22 13:00:00.606", "branchLockEnabled": false }
    ];

    for (const user of users) {
        let roleId = user.roleId;
        if (user.roleId === 'cmi7oymq60019vaec0v4jbugm') {
            roleId = superAdminRole.id;
        } else {
            roleId = cashierRole.id;
        }

        const branchId = branch.id;
        const isSuperMegaAdmin = user.email === 'cybergada@gmail.com';

        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                firstName: user.firstName,
                lastName: user.lastName,
                passwordHash: user.passwordHash,
                roleId: roleId,
                branchId: branchId,
                status: user.status,
                emailVerified: user.emailVerified,
                isSuperMegaAdmin: isSuperMegaAdmin,
            },
            create: {
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                roleId: roleId,
                branchId: branchId,
                status: user.status,
                emailVerified: user.emailVerified,
                ...(user.lastLoginAt ? { lastLoginAt: new Date(user.lastLoginAt) } : {}),
                ...(user.createdAt ? { createdAt: new Date(user.createdAt) } : {}),
                ...(user.updatedAt ? { updatedAt: new Date(user.updatedAt) } : {}),
                isSuperMegaAdmin: isSuperMegaAdmin,
            },
        });
    }

    console.log(`✅ Seeded ${users.length} users from JSON list.`);
}
