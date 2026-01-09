'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Vote, CreditCard, Sprout, IdCard, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CooperativeDashboard() {
    const router = useRouter();

    const modules = [
        {
            title: 'Member Registry',
            description: 'Manage cooperative members and vital records',
            icon: Users,
            href: '/cooperative/members',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Coordination Center',
            description: 'Initiatives, Proposals, and Task Forces',
            icon: Vote,
            href: '/cooperative/coordination',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'E-Wallet Admin',
            description: 'Manage member wallets and transactions',
            icon: CreditCard,
            href: '/cooperative/wallet',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Farm Management',
            description: 'Track member farms and harvests',
            icon: Sprout,
            href: '/cooperative/farms',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        },
        {
            title: 'ID Station',
            description: 'Design and issue Member IDs',
            icon: IdCard,
            href: '/cooperative/id-station',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Cooperative Management</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                    <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(module.href)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-medium">
                                {module.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${module.bgColor}`}>
                                <module.icon className={`h-6 w-6 ${module.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm text-muted-foreground mt-2">
                                {module.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
