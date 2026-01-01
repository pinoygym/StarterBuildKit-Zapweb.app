import { Suspense } from "react";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading application...</div>}>
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </Suspense>
        </ThemeProvider>
    );
}
