const { execSync } = require('child_process');
const fs = require('fs');
try {
    const output = execSync('node node_modules/prisma/build/index.js validate --schema=prisma/test.prisma', { encoding: 'utf8' });
    fs.writeFileSync('prisma_out.log', 'SUCCESS:\n' + output);
} catch (error) {
    fs.writeFileSync('prisma_out.log', 'FAILURE:\nSTDOUT:\n' + error.stdout + '\nSTDERR:\n' + error.stderr);
}
