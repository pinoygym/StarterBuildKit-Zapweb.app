import { Sidebar } from '@/components/shared/sidebar';
import { BranchSelector } from '@/components/shared/branch-selector';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header with branch selector */}
        <header className="sticky top-0 z-30 bg-card border-b px-4 lg:px-8 py-4 mt-14 lg:mt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-sm font-medium text-muted-foreground">
                Welcome to Softdrinks Distributions Corporation - Business Management System. powered by www.zapweb.app
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <BranchSelector />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
