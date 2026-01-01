
import fs from 'fs';

try {
    // Try reading as utf-16le first, as PowerShell > often produces this
    const content = fs.readFileSync('prod-backup-raw.txt', 'utf16le');
    console.log('--- UTF-16LE START ---');
    console.log(content.slice(0, 500));
    console.log('--- UTF-16LE END ---');
} catch (e) {
    console.log('Error reading as utf16le', e.message);
}

try {
    // Fallback to utf-8 to see if that looks better
    const content = fs.readFileSync('prod-backup-raw.txt', 'utf8');
    console.log('--- UTF-8 START ---');
    console.log(content.slice(0, 500));
    console.log('--- UTF-8 END ---');
} catch (e) {
    console.log('Error reading as utf8', e.message);
}
