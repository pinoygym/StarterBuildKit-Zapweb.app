import { userRepository } from '../repositories/user.repository';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Verifying user hiding...');
    try {
        const result = await userRepository.findAll();

        const cybergada = result.data.find(u => u.email === 'cybergada@gmail.com');
        const superMegaAdmins = result.data.filter(u => u.isSuperMegaAdmin);

        if (cybergada) {
            console.error('FAIL: Found cybergada user!');
            process.exit(1);
        } else {
            console.log('PASS: cybergada user is hidden.');
        }

        if (superMegaAdmins.length > 0) {
            console.error(`FAIL: Found ${superMegaAdmins.length} Super Mega Admins!`);
            process.exit(1);
        } else {
            console.log('PASS: No Super Mega Admins found.');
        }
    } catch (error) {
        console.error('Error running verification:', error);
        process.exit(1);
    }
}

main().catch(console.error);
