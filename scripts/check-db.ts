
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('Checking DB state...');

    const users = await prisma.user.findMany();
    console.log(`Users: ${users.length}`);
    users.forEach(u => console.log(` - ${u.email} (${u.roleId})`));

    const branches = await prisma.branch.findMany();
    console.log(`Branches: ${branches.length}`);
    branches.forEach(b => console.log(` - ${b.name} (${b.code})`));

    const products = await prisma.product.findMany();
    console.log(`Products: ${products.length}`);
    products.forEach(p => console.log(` - ${p.name} (Stock: ?)`));

    const inventory = await prisma.inventory.findMany();
    console.log(`Inventory: ${inventory.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
