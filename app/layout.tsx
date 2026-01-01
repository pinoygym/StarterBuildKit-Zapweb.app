import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/contexts/auth.context";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClientToaster } from "@/components/ui/client-toaster";
import { Toaster as Sonner } from "sonner";
import { Suspense } from "react";
import { BranchProvider } from "@/contexts/branch-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InventoryPro - Inventory Management System",
  description: "Comprehensive inventory management and POS system for wholesale delivery companies",
  other: {
    'color-scheme': 'light dark',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading application...</div>}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <BranchProvider>
                  {children}
                  <ClientToaster />
                  <Sonner position="top-right" richColors />
                </BranchProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  );
}
