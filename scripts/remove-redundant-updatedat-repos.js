const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Removing redundant updatedAt assignments from repositories...\n');

const reposDir = path.join(__dirname, '..', 'repositories');
const files = glob.sync(`${reposDir}/**/*.ts`);

let totalChanges = 0;
let filesChanged = [];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Pattern 1: Simple "updatedAt: new Date()," on its own line
    content = content.replace(/^\s*updatedAt:\s*new\s+Date\(\),?\s*$/gm, '');

    // Pattern 2: In spread: "...data, updatedAt: new Date()" -> "...data"
    content = content.replace(/(\.\.\.\w+),\s*updatedAt:\s*new\s+Date\(\)/g, '$1');

    // Pattern 3: Clean up trailing commas after removal
    content = content.replace(/,(\s*)\}/g, '$1}');

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

console.log('\n✨ Repositories have been updated!');
console.log('📌 The @updatedAt decorator in the schema will now handle these automatically.');
