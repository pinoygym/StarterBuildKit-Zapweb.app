import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting HR seed...');

    // 1. Get default branch
    const branch = await prisma.branch.findFirst();
    if (!branch) {
        throw new Error('No branch found. Please run the main seed first.');
    }

    // 2. Get/Create EMPLOYEE role
    let employeeRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
    if (!employeeRole) {
        employeeRole = await prisma.role.create({
            data: {
                id: crypto.randomUUID(),
                name: 'EMPLOYEE',
                description: 'Standard employee',
                updatedAt: new Date(),
            },
        });
    }

    const today = new Date();

    // 3. Create test users with EmployeeProfiles
    const testEmployees = [
        {
            email: 'employee1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            hourlyRate: 150,
            designation: 'Software Engineer',
        },
        {
            email: 'employee2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            hourlyRate: 200,
            designation: 'Senior Developer',
        },
    ];

    for (const emp of testEmployees) {
        const user = await prisma.user.upsert({
            where: { email: emp.email },
            update: {},
            create: {
                id: crypto.randomUUID(),
                email: emp.email,
                passwordHash: 'hashed_password', // In real life, use a proper hash
                firstName: emp.firstName,
                lastName: emp.lastName,
                roleId: employeeRole.id,
                branchId: branch.id,
                updatedAt: new Date(),
            },
        });

        await prisma.employeeProfile.upsert({
            where: { userId: user.id },
            update: {
                hourlyRate: emp.hourlyRate,
                designation: emp.designation,
            },
            create: {
                id: crypto.randomUUID(),
                userId: user.id,
                employeeId: `EMP-${user.id.substring(0, 8)}`,
                hourlyRate: emp.hourlyRate,
                designation: emp.designation,
                updatedAt: new Date(),
            },
        });

        // 4. Create Attendance Records for the last 5 days
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const checkIn = new Date(date);
            checkIn.setHours(8, 0, 0, 0);

            const checkOut = new Date(date);
            checkOut.setHours(17, 0, 0, 0);

            await prisma.attendanceRecord.upsert({
                where: {
                    userId_date: {
                        userId: user.id,
                        date: date,
                    }
                },
                update: {
                    checkIn,
                    checkOut,
                    status: 'PRESENT',
                    totalHours: 9,
                },
                create: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    date: date,
                    checkIn,
                    checkOut,
                    status: 'PRESENT',
                    totalHours: 9,
                    updatedAt: new Date(),
                }
            });
        }
    }

    console.log('Seeded employees and attendance');

    // 5. Create a Payroll Period
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 14);
    const endDate = new Date(today);

    await prisma.payrollPeriod.create({
        data: {
            id: crypto.randomUUID(),
            startDate,
            endDate,
            status: 'DRAFT',
            updatedAt: new Date(),
        }
    });

    console.log('Seeded payroll period');

    console.log('\n=== HR Seed completed successfully! ===');
}

main()
    .catch((e) => {
        console.error('Error during HR seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
