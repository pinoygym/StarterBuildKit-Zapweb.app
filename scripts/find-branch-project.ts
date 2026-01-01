import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const projectIds = [
    'polished-paper-85326117',  // green
    'fragrant-scene-86315143',  // BMS3ChatGPTPlanClaudeImplementation
    'bitter-scene-25803889',    // testPOSKiro
    'plain-dawn-65553587',      // kiroSoftdrinks
    'round-bar-60793532',       // FlutterTestPOS
    'frosty-wave-04050128',     // QRCode
    'raspy-pine-67327759',      // PTAFinalvelFamous
    'bitter-silence-45736920',  // startkitNeon
    'steep-dream-91436306',     // usermanagement
    'odd-king-63959231',        // app1
];

async function findBranch() {
    console.log('🔍 Searching for branch: ep-broad-darkness-a1hfk92l\n');

    for (const projectId of projectIds) {
        try {
            const { stdout } = await execAsync(`neonctl branches list --project-id ${projectId} --output json`);
            const branches = JSON.parse(stdout);

            const found = branches.branches?.find((b: any) => b.id === 'br-broad-darkness-a1hfk92l');

            if (found) {
                console.log('✅ FOUND!');
                console.log(`\nProject ID: ${projectId}`);
                console.log(`Branch Name: ${found.name}`);
                console.log(`Branch ID: ${found.id}`);
                console.log(`State: ${found.current_state}`);
                console.log(`Created: ${found.created_at}`);

                // Get project details
                const { stdout: projectInfo } = await execAsync(`neonctl projects get ${projectId} --output json`);
                const project = JSON.parse(projectInfo);
                console.log(`\nProject Name: ${project.project.name}`);
                return;
            }
        } catch (error) {
            // Continue to next project
        }
    }

    console.log('❌ Branch not found in any of the listed projects');
}

findBranch();
