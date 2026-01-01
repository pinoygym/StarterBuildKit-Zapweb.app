'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntityCounts } from '@/hooks/use-dashboard';
import { Users, Truck, MapPin, Warehouse, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemOverviewProps {
    branchId?: string;
}

export function SystemOverview({ branchId }: SystemOverviewProps) {
    const { data: counts, isLoading } = useEntityCounts(branchId);

    const stats = [
        { label: 'Customers', key: 'customers', icon: Users, color: 'text-blue-500 bg-blue-50' },
        { label: 'Suppliers', key: 'suppliers', icon: Truck, color: 'text-purple-500 bg-purple-50' },
        { label: 'Branches', key: 'branches', icon: MapPin, color: 'text-green-500 bg-green-50' },
        { label: 'Warehouses', key: 'warehouses', icon: Warehouse, color: 'text-orange-500 bg-orange-50' },
        { label: 'Users', key: 'users', icon: Users, color: 'text-indigo-500 bg-indigo-50' },
        { label: 'Sales Orders', key: 'salesOrders', icon: LayoutDashboard, color: 'text-pink-500 bg-pink-50' },
    ];

    return (
        <Card className="col-span-1 md:col-span-8">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5" />
                    System Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            const value = counts?.[stat.key] || 0;
                            return (
                                <div key={stat.key} className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className={`p-2 rounded-full ${stat.color} mb-2`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-bold">{value}</span>
                                    <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
