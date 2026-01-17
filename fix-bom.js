const fs = require('fs');
const path = 'prisma/schema.prisma';
const content = fs.readFileSync(path, 'utf8');
// Remove BOM if it exists
const cleanContent = content.replace(/^\uFEFF/, '');
fs.writeFileSync(path, cleanContent, 'utf8');
console.log('BOM removed from prisma/schema.prisma');
