
import fs from 'fs';

const raw = fs.readFileSync('prod-backup-raw.txt', 'utf16le');
const start = raw.indexOf('JSON_START');
const end = raw.indexOf('JSON_END');

if (start === -1 || end === -1) {
    console.error('Could not find JSON markers');
    process.exit(1);
}

const json = raw.substring(start + 'JSON_START'.length, end).trim();
fs.writeFileSync('prod-backup.json', json);
console.log('Extracted backup JSON to prod-backup.json');
