
import { Prisma } from '@prisma/client';

// @ts-ignore
const dmmf = Prisma.dmmf;
const model = dmmf.datamodel.models.find((m: any) => m.name === 'Product');
console.log(JSON.stringify(model, null, 2));
