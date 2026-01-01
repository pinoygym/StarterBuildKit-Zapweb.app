const fs = require('fs');

const filePath = 'app/api/reports/employee-performance/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find the position after the last import statement
const lines = content.split('\n');
let insertIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "} from '@/lib/report-security';") {
        insertIndex = i + 1;
        break;
    }
}

if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';");
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully added dynamic export to employee-performance route.ts');
} else {
    console.log('Could not find insertion point');
}
