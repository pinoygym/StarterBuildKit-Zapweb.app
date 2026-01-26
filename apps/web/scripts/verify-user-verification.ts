
import { authService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';

async function main() {
    const email = `test.verify.${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('1. Registering new user...');
    const registerResult = await authService.registerUser({
        email,
        password,
        firstName: 'Test',
        lastName: 'Verification',
        roleId: '', // AuthService defaults to Cashier if empty
    });

    if (!registerResult.success) {
        console.error('Registration failed:', registerResult.message);
        process.exit(1);
    }
    console.log('Registration successful:', registerResult.message);

    // Check user status
    const user = await userRepository.findByEmail(email);
    if (!user) {
        console.error('User not found in DB');
        process.exit(1);
    }

    console.log(`User status: ${user.status}`);
    console.log(`Email verified: ${user.emailVerified}`);

    if (user.status !== 'UNVERIFIED' || user.emailVerified !== false) {
        console.error('FAIL: User should be UNVERIFIED and emailVerified false');
        process.exit(1);
    } else {
        console.log('PASS: User is UNVERIFIED and emailVerified is false');
    }

    // Try login
    console.log('2. Attempting login (should fail)...');
    const loginFail = await authService.login({ email, password });
    if (loginFail.success) {
        console.error('FAIL: Login should have failed');
        process.exit(1);
    } else {
        console.log(`PASS: Login failed as expected: ${loginFail.message}`);
    }

    // Update status to ACTIVE
    console.log('3. Verifying user (Admin action)...');
    // Simulating admin verification which sets status to ACTIVE and emailVerified to true
    await userRepository.update(user.id, { status: 'ACTIVE', emailVerified: true });
    console.log('User updated to ACTIVE and Verified');

    // Try login again
    console.log('4. Attempting login (should succeed)...');
    const loginSuccess = await authService.login({ email, password });
    if (!loginSuccess.success) {
        console.error('FAIL: Login should have succeeded', loginSuccess.message);
        process.exit(1);
    } else {
        console.log('PASS: Login successful');
    }

    // Cleanup
    console.log('Cleaning up...');
    await userRepository.delete(user.id);
    console.log('Test user deleted');
}

main().catch(console.error);
