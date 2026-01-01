const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Removing redundant updatedAt assignments from services...\n');

const servicesDir = path.join(__dirname, '..', 'services');
const files = glob.sync(`${servicesDir}/**/*.ts`);

let totalChanges = 0;
let filesChanged = [];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Remove lines with "updatedAt: new Date()," (with trailing comma)
    content = content.replace(/^\s*updatedAt:\s*new\s+Date\(\),?\s*$/gm, '');

    // Remove lines with just "updatedAt: new Date()" followed by comment
    content = content.replace(/^\s*updatedAt:\s*new\s+Date\(\)\s*\/\/.*$/gm, '');

    // Clean up any double blank lines that might result
    content = content.replace(/\n\n\n+/g, '\n\n');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);
        filesChanged.push(relativePath);
        totalChanges++;
    }
});

console.log(`✅ Removed redundant updatedAt assignments from ${totalChanges} files:\n`);
filesChanged.forEach(file => {
    console.log(`   - ${file}`);
});

console.log('\n✨ Services have been updated!');
console.log('📌 The @updatedAt decorator in the schema will now handle these automatically.');
