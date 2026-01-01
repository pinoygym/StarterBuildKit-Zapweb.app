'use client';

import { useAuth } from '@/contexts/auth.context';
import { useBranchContext } from '@/contexts/branch-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/shared/sidebar';
import { BranchSelector } from '@/components/shared/branch-selector';
import { NotificationBell } from '@/components/layout/notification-bell';


export function DashboardLayoutClient({ children, counts }: { children: ReactNode, counts?: Record<string, number> }) {
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
            <Sidebar counts={counts} />
            <div className="lg:pl-64">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <BranchSelector />
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground mr-4 hidden sm:block">
                            Support: 0981-125-4446 & 0915-891-8530
                        </span>
                        <NotificationBell />
                        {/* Add UserNav or other right-side items here later */}
                    </div>
                </div>
                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
