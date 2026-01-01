
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Available models in Prisma client:');
    const proxy = prisma as any;
    const keys = Object.keys(proxy).filter(key => !key.startsWith('$') && !key.startsWith('_'));
    console.log(JSON.stringify(keys, null, 2));
}

main();
