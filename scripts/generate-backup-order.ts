
import * as fs from 'fs';
import * as path from 'path';

// Topology sort helper
function topologicalSort(graph: Map<string, Set<string>>, nodes: string[]): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    // Ensure all nodes are in graph so we don't miss any disconnected components
    // (Though nodes[] passed in should cover it)

    function visit(node: string) {
        if (temp.has(node)) {
            // console.warn(`Cycle detected involving ${node}`);
            return;
        }
        if (visited.has(node)) return;

        temp.add(node);

        const deps = graph.get(node) || new Set();
        for (const dep of deps) {
            visit(dep);
        }

        temp.delete(node);
        visited.add(node);
        order.push(node);
    }

    // Sort nodes to ensure deterministic output for independent branches
    const sortedNodes = [...nodes].sort();

    for (const node of sortedNodes) {
        visit(node);
    }

    return order;
}

function main() {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        console.error(`Schema not found at ${schemaPath}`);
        process.exit(1);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Naive parser
    const models = new Set<string>();
    const dependencyGraph = new Map<string, Set<string>>();

    // Remove comments
    const cleanSchema = schemaContent.replace(/\/\/.*/g, '');

    // Regex to match "model Name {"
    const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;

    let match;
    while ((match = modelRegex.exec(cleanSchema)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];

        models.add(modelName);
        if (!dependencyGraph.has(modelName)) {
            dependencyGraph.set(modelName, new Set());
        }

        // Parse fields
        // Field line: name type attributes...
        // We look for @relation
        const lines = modelBody.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('@@')) continue; // Block attribute

            // Parse line
            // Example: "User User? @relation(fields: [userId], references: [id])"
            // Parts: Name Type ... @relation...

            // Regex for a field with @relation and fields: [...]
            // matching fields:[...] ensures we are the owner side
            if (trimmed.includes('@relation') && trimmed.includes('fields:')) {
                // simple split by space logic is flaky with multi-spaces, but regex is better
                // Match: name (space)+ type (space)+ ...
                const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)/);
                if (fieldMatch) {
                    const type = fieldMatch[2]; // The 2nd word is usually the Type

                    // Add dependency: modelName DEPENDS ON type
                    // So we must handle type FIRST.
                    // dependencyGraph: modelName -> Set(type)
                    if (type !== modelName && type !== 'String' && type !== 'Int' && type !== 'Float' && type !== 'Boolean' && type !== 'DateTime' && type !== 'Json' && type !== 'Decimal' && type !== 'BigInt' && type !== 'Bytes') {
                        // Check if type is actually a model (could be enum)
                        // verifying later against collected models list is better, but effectively we only add edge here.
                        dependencyGraph.get(modelName)?.add(type);
                    }
                }
            }
        }
    }

    // Filter out dependencies that are NOT models (e.g. Enums)
    // We do this by checking if the dependency target itself exists in the 'models' set.
    for (const [node, deps] of dependencyGraph.entries()) {
        for (const dep of deps) {
            if (!models.has(dep)) {
                deps.delete(dep);
            }
        }
    }

    const modelNames = Array.from(models);
    const creationOrder = topologicalSort(dependencyGraph, modelNames);

    console.log('// Creation Order (Parent -> Child):');
    console.log(JSON.stringify(creationOrder, null, 2));

    // Also output a formatted array string for easy pasting
    console.log('\n// Formatted for BackupService (Creation Order):');
    const formatted = creationOrder.map(name => {
        // camelCase for variable names often used in the service
        // const key = name.charAt(0).toLowerCase() + name.slice(1) + (name.endsWith('s') ? '' : 's'); 
        // Actually the service uses `prisma[modelName].findMany()` so we just need the model name or property name
        return name;
    });
    console.log(JSON.stringify(formatted, null, 2));

}

main();
