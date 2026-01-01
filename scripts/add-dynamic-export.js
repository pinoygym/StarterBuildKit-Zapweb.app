const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in app/api
const routeFiles = glob.sync('app/api/**/route.ts', { cwd: process.cwd() });

console.log(`Found ${routeFiles.length} route files`);

let updatedCount = 0;
let skippedCount = 0;

routeFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
        console.log(`Skipped (already has dynamic): ${file}`);
        skippedCount++;
        return;
    }

    // Find the position after the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
        }
    }

    if (lastImportIndex === -1) {
        // No imports, add at the beginning
        content = "export const dynamic = 'force-dynamic';\n\n" + content;
    } else {
        // Add after the last import
        lines.splice(lastImportIndex + 1, 0, '', "export const dynamic = 'force-dynamic';");
        content = lines.join('\n');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
    updatedCount++;
});

console.log(`\nSummary:`);
console.log(`- Updated: ${updatedCount} files`);
console.log(`- Skipped: ${skippedCount} files`);
console.log(`- Total: ${routeFiles.length} files`);
