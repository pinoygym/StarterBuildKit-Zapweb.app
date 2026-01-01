import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth.service';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

async function getNotifications() {
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return null;

    const payload = authService.verifyToken(token);
    if (!payload) return null;

    return await prisma.notification.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    if (notifications === null) {
        redirect('/login');
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
            </div>
            <Separator />

            <div className="grid gap-4">
                {notifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No notifications found.
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <Card key={notification.id} className={notification.isRead ? 'opacity-70' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-medium">
                                        {notification.title}
                                    </CardTitle>
                                    {!notification.isRead && <Badge>New</Badge>}
                                    <Badge variant="outline">{notification.type}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                                {notification.link && (
                                    <Button variant="link" className="p-0 h-auto" asChild>
                                        <a href={notification.link}>View Details</a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
