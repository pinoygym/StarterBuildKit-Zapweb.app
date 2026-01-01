const fs = require('fs');
try {
    const content = fs.readFileSync('errors_2.txt', 'utf16le');
    const lines = content.split('\n');
    const errors = lines.filter(l => l.includes('error TS'));
    console.log(errors.join('\n'));
} catch (e) {
    console.error(e);
}
