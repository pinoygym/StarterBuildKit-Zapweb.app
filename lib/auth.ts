import { cookies } from 'next/headers';
import { authService } from '@/services/auth.service';

/**
 * Get server session from cookies
 * Simulates NextAuth's getServerSession but uses our custom JWT implementation
 */
export async function getServerSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
        return null;
    }

    const payload = authService.verifyToken(token);

    if (!payload) {
        return null;
    }

    return {
        user: {
            id: payload.userId,
            email: payload.email,
            roleId: payload.roleId,
            branchId: payload.branchId,
        }
    };
}
