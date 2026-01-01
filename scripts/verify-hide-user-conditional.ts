import { userRepository } from '../repositories/user.repository';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Verifying conditional user hiding...');
    try {
        // Test 1: Simulate regular user (includeSuperMegaAdmin: false/undefined)
        console.log('Test 1: Regular User Request');
        const regularResult = await userRepository.findAll({});
        const cybergadaRegular = regularResult.data.find(u => u.email === 'cybergada@gmail.com');

        if (cybergadaRegular) {
            console.error('FAIL: Regular user can see cybergada!');
            process.exit(1);
        } else {
            console.log('PASS: Regular user CANNOT see cybergada.');
        }

        // Test 2: Simulate Super Mega Admin (includeSuperMegaAdmin: true)
        console.log('Test 2: Super Mega Admin Request');
        const adminResult = await userRepository.findAll({ includeSuperMegaAdmin: true });
        const cybergadaAdmin = adminResult.data.find(u => u.email === 'cybergada@gmail.com');

        if (!cybergadaAdmin) {
            console.error('FAIL: Super Mega Admin CANNOT see cybergada!');
            process.exit(1);
        } else {
            console.log('PASS: Super Mega Admin CAN see cybergada.');
        }

    } catch (error) {
        console.error('Error running verification:', error);
        process.exit(1);
    }
}

main().catch(console.error);
