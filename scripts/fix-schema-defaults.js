const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('🔍 Analyzing schema for missing defaults...\n');

// Track changes
let changes = [];

// Fix 1: Add @default(cuid()) to id fields that are missing it
const idPattern = /^(\s+id\s+String\s+@id)(\s*)$/gm;
let idMatches = 0;
schema = schema.replace(idPattern, (match, p1, p2) => {
    idMatches++;
    changes.push(`Added @default(cuid()) to id field (match ${idMatches})`);
    return `${p1} @default(cuid())${p2}`;
});

console.log(`✅ Fixed ${idMatches} id fields without @default(cuid())`);

// Fix 2: Add @updatedAt to updatedAt fields that are missing it
const updatedAtPattern = /^(\s+updatedAt\s+DateTime)(\s*)$/gm;
let updatedAtMatches = 0;
schema = schema.replace(updatedAtPattern, (match, p1, p2) => {
    updatedAtMatches++;
    changes.push(`Added @updatedAt to updatedAt field (match ${updatedAtMatches})`);
    return `${p1} @updatedAt${p2}`;
});

console.log(`✅ Fixed ${updatedAtMatches} updatedAt fields without @updatedAt`);

// Write the updated schema
fs.writeFileSync(schemaPath, schema, 'utf-8');

console.log('\n📝 Summary of changes:');
changes.forEach((change, index) => {
    console.log(`  ${index + 1}. ${change}`);
});

console.log('\n✨ Schema has been updated!');
console.log('📌 Next steps:');
console.log('   1. Run: bunx prisma format');
console.log('   2. Run: bunx prisma generate');
console.log('   3. Test saving data in all modules');
