
import { Prisma } from '@prisma/client';

// @ts-ignore
const dmmf = Prisma.dmmf;
const model = dmmf.datamodel.models.find((m: any) => m.name === 'Product');
const field = model.fields.find((f: any) => f.name === 'ProductCategory');
console.log('ProductCategory field:', field);
console.log('Keys:', Object.keys(field));
