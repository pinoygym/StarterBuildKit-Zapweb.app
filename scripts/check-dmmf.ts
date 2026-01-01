
import { Prisma } from '@prisma/client';

console.log('Model names:', Object.keys(Prisma.ModelName));

try {
    // @ts-ignore
    const dmmf = Prisma.dmmf;
    if (dmmf) {
        console.log('DMMF is available directly on Prisma');
    } else {
        console.log('DMMF not found on Prisma directly');
        // @ts-ignore
        const dmmf2 = Prisma.DMMF;
        if (dmmf2) {
            console.log('DMMF available as Prisma.DMMF type symbol (not runtime)');
        }
    }
} catch (e) {
    console.error('Error accessing DMMF:', e);
}
