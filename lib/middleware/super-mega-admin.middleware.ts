import { User } from '@prisma/client';

/**
 * Middleware to check if user is a Super Mega Admin
 * Super Mega Admin is the master key account with access to admin testing tools
 */
export function requireSuperMegaAdmin(user: User | null): void {
    if (!user) {
        throw new Error('Unauthorized: Authentication required');
    }

    if (!user.isSuperMegaAdmin) {
        throw new Error('Forbidden: Super Mega Admin access required');
    }
}

/**
 * Check if a user is the Super Mega Admin
 */
export function isSuperMegaAdmin(user: User | null): boolean {
    return user?.isSuperMegaAdmin === true;
}

/**
 * Check if a user account can be deleted
 * Super Mega Admin accounts cannot be deleted
 */
export function canDeleteUser(user: User): boolean {
    return !user.isSuperMegaAdmin;
}

/**
 * Check if a user's role can be changed
 * Super Mega Admin accounts cannot have their role changed
 */
export function canChangeUserRole(user: User): boolean {
    return !user.isSuperMegaAdmin;
}

/**
 * Check if a user can be deactivated
 * Super Mega Admin accounts cannot be deactivated
 */
export function canDeactivateUser(user: User): boolean {
    return !user.isSuperMegaAdmin;
}
