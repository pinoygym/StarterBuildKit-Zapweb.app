const { spawn } = require('child_process');

console.log("Starting type-check...");
const child = spawn('npm.cmd', ['run', 'type-check'], { shell: true });

let stdout = '';
let stderr = '';

child.stdout.on('data', (data) => {
    stdout += data.toString();
});

child.stderr.on('data', (data) => {
    stderr += data.toString();
});

child.on('close', (code) => {
    console.log(`Exited with code ${code}`);

    if (stdout.includes('TS2307')) {
        console.log("FOUND TS2307:");
        console.log(stdout.split('\n').filter(l => l.includes('TS2307')).join('\n'));
    } else {
        console.log("TS2307 NOT FOUND");
    }

    if (stdout.includes('UncheckedCreateInput')) {
        console.log("FOUND UncheckedCreateInput");
    } else {
        console.log("UncheckedCreateInput NOT FOUND");
    }

    const errors = stdout.split('\n').filter(l => l.includes('error TS'));
    console.log("All TS Errors found:");
    console.log(errors.slice(0, 20).join('\n'));
});
