import { authService } from './services/auth.service';
import { membershipTypeService } from './services/membership-type.service';
import { cooperativeMemberService } from './services/cooperative-member.service';

async function main() {
    console.log('Testing imports...');
    try {
        console.log('AuthService import successful');
        console.log('MembershipTypeService import successful');
        console.log('CooperativeMemberService import successful');

        // Test a simple method
        const types = await membershipTypeService.getAllTypes();
        console.log(`Found ${types.length} membership types`);
    } catch (error) {
        console.error('Diagnostic failed:', error);
    }
}

main();
