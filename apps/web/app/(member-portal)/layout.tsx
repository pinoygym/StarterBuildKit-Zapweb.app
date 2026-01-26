import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Member Portal | InventoryPro',
    description: 'Access your cooperative membership account.',
};

export default function MemberPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-emerald-900 text-white p-4 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-white/10 rounded-full" />
                        <h1 className="text-xl font-bold tracking-tight">CoopLink <span className="font-light opacity-80">Member Portal</span></h1>
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto p-4 md:p-8">
                {children}
            </main>
            <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
                <p>&copy; 2024 InventoryPro Cooperative. All rights reserved.</p>
            </footer>
        </div>
    );
}
