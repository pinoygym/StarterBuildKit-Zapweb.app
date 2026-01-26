
import * as fs from 'fs';
import * as path from 'path';

function main() {
    const servicePath = path.resolve(process.cwd(), 'services/backup.service.ts');
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');

    if (!fs.existsSync(servicePath) || !fs.existsSync(schemaPath)) {
        console.error('Service or schema file not found.');
        process.exit(1);
    }

    const serviceContent = fs.readFileSync(servicePath, 'utf-8');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Extract models from schema
    const cleanSchema = schemaContent.replace(/\/\/.*/g, '');
    const modelRegex = /model\s+(\w+)\s+\{/g;
    const schemaModels = new Set<string>();
    let match;
    while ((match = modelRegex.exec(cleanSchema)) !== null) {
        schemaModels.add(match[1]);
    }

    // Extract models from service (MODEL_CREATION_ORDER array)
    const arrayRegex = /const MODEL_CREATION_ORDER = \[\s*([\s\S]*?)\];/;
    const arrayMatch = arrayRegex.exec(serviceContent);
    if (!arrayMatch) {
        console.error('Could not find MODEL_CREATION_ORDER in service file.');
        process.exit(1);
    }

    const arrayContent = arrayMatch[1];
    // split by comma, remove quotes, trim
    const serviceModels = new Set<string>();
    arrayContent.split(',').forEach(line => {
        const trimmed = line.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        if (trimmed) serviceModels.add(trimmed);
    });

    // Compare
    const missingInService = [...schemaModels].filter(m => !serviceModels.has(m));
    const extraInService = [...serviceModels].filter(m => !schemaModels.has(m));

    if (missingInService.length > 0) {
        console.error('❌ Missing models in BackupService:', missingInService);
        process.exit(1);
    }

    if (extraInService.length > 0) {
        console.warn('⚠ Extra models in BackupService (might be deleted from schema):', extraInService);
    }

    console.log(`✅ Verification Success! All ${schemaModels.size} models are covered in BackupService.`);
}

main();
