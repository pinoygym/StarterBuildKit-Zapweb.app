'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentActivities } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Package, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActivitiesProps {
    branchId?: string;
    limit?: number;
}

export function RecentActivities({ branchId, limit = 10 }: RecentActivitiesProps) {
    const { data: activities, isLoading } = useRecentActivities(branchId, limit);

    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return ShoppingCart;
            case 'purchase': return Package;
            case 'adjustment': return AlertTriangle;
            case 'expense': return CreditCard;
            default: return Clock;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'sale': return 'text-green-500 bg-green-50';
            case 'purchase': return 'text-blue-500 bg-blue-50';
            case 'adjustment': return 'text-yellow-500 bg-yellow-50';
            case 'expense': return 'text-red-500 bg-red-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    return (
        <Card className="col-span-1 md:col-span-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activities
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-3 w-[150px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!activities || activities.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No recent activities found.</p>
                        ) : (
                            activities.map((activity) => {
                                const Icon = getIcon(activity.type);
                                return (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">{activity.description}</p>
                                                {activity.amount && (
                                                    <p className="text-sm font-semibold">
                                                        {formatCurrency(Number(activity.amount))}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                                {activity.status && (
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${activity.status === 'completed' || activity.status === 'POSTED' ? 'bg-green-100 text-green-700' :
                                                            activity.status === 'pending' || activity.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {activity.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
