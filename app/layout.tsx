import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BranchProvider } from "@/contexts/branch-context";
import { AuthProvider } from "@/contexts/auth.context";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InventoryPro - Inventory Management System",
  description: "Comprehensive inventory management and POS system for wholesale delivery companies",
  other: {
    'color-scheme': 'light',
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
        <meta name="color-scheme" content="light" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <ErrorBoundary>
            <AuthProvider>
              <BranchProvider>
                {children}
                <Toaster />
                <Sonner position="top-right" richColors />
              </BranchProvider>
            </AuthProvider>
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
