import { cookies, headers } from 'next/headers';
import { authService } from '@/services/auth.service';

/**
 * Get server session from cookies or Authorization header
 * Simulates NextAuth's getServerSession but uses our custom JWT implementation
 */
export async function getServerSession() {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;

    if (!token) {
        const headerList = await headers();
        const authHeader = headerList.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

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
