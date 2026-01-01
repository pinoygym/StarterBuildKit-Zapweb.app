
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const agents = [
    "Sherwin Laguna",
    "Albert Ebale",
    "Arnel Calda",
    "Juneniel Esmero",
    "Pablo Dohinog",
    "Alvin Torrefiel",
    "Angelito Barral",
    "Marjhun Ruiz"
];

async function main() {
    console.log('Starting seed of Sales Agents...');

    for (let i = 0; i < agents.length; i++) {
        const name = agents[i];
        const code = `SA-${(i + 1).toString().padStart(3, '0')}`;

        try {
            const existingAgent = await prisma.salesAgent.findFirst({
                where: { name: name }
            });

            if (existingAgent) {
                console.log(`Agent "${name}" already exists. Skipping.`);
                continue;
            }

            const agent = await prisma.salesAgent.create({
                data: {
                    name,
                    code,
                    status: 'active',
                    displayOrder: i + 1
                }
            });
            console.log(`Created agent: ${agent.name} (${agent.code})`);
        } catch (error) {
            console.error(`Error processing agent ${name}:`, error);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error('Fatal Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
