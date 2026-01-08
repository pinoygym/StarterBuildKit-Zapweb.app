'use client';

import { useAuth } from '@/contexts/auth.context';
import { useBranchContext } from '@/contexts/branch-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/shared/sidebar';
import { BranchSelector } from '@/components/shared/branch-selector';
import { NotificationBell } from '@/components/layout/notification-bell';
import { TenantConfig } from '@/config/tenants';


export function DashboardLayoutClient({ children, counts, tenantConfig }: { children: ReactNode, counts?: Record<string, number>, tenantConfig?: TenantConfig }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        console.log('DashboardLayout Effect:', { isLoading, isAuthenticated, pathname });
        if (!isLoading && !isAuthenticated) {
            const url = new URL('/login', window.location.href);
            url.searchParams.set('redirect', pathname);
            console.log('Redirecting to:', url.toString());
            router.push(url.pathname + url.search);
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar counts={counts} tenantConfig={tenantConfig} />
            {/* Add padding-top on mobile to account for fixed mobile header */}
            <div className="lg:pl-64 pt-16 lg:pt-0">
                <div className="fixed lg:sticky top-0 left-0 right-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-2 border-b border-border bg-background px-3 shadow-sm sm:gap-x-4 sm:px-4 lg:gap-x-6 lg:px-8 lg:left-64">
                    <BranchSelector />
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Stack support numbers vertically on very small screens */}
                        <div className="hidden md:block">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                Support: 0981-125-4446 & 0915-891-8530
                            </span>
                        </div>
                        <NotificationBell />
                        {/* Add UserNav or other right-side items here later */}
                    </div>
                </div>
                <main className="py-4 sm:py-6 lg:py-10">
                    <div className="px-3 sm:px-4 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
