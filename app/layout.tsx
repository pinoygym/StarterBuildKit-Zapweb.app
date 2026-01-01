import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BranchProvider } from "@/contexts/branch-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InventoryPro - Inventory Management System",
  description: "Comprehensive inventory management and POS system for wholesale delivery companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BranchProvider>
          {children}
          <Toaster />
        </BranchProvider>
      </body>
    </html>
  );
}
