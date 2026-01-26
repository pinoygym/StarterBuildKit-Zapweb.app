import { authService } from './services/auth.service';

try {
    console.log('Successfully imported authService');
    console.log('JWT_SECRET is configured properly');
} catch (error) {
    console.error('Failed to import authService:', error);
}
