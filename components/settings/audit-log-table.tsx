'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { AuditLogWithUser } from '@/types/audit.types';

interface AuditLogTableProps {
    logs: AuditLogWithUser[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
    const getActionBadgeVariant = (action: string) => {
        if (action.includes('CREATE')) return 'default';
        if (action.includes('UPDATE')) return 'secondary';
        if (action.includes('DELETE')) return 'destructive';
        if (action.includes('CANCEL')) return 'destructive';
        if (action.includes('POST')) return 'outline';
        return 'outline';
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Resource ID</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No audit logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="text-sm whitespace-nowrap">
                                    {formatDate(log.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {log.User ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {log.User.firstName} {log.User.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {log.User.email}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">System</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getActionBadgeVariant(log.action)}>
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {log.resource}
                                    </code>
                                </TableCell>
                                <TableCell className="text-xs font-mono">
                                    {log.resourceId || '-'}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-xs">
                                    {log.details ? JSON.stringify(log.details) : '-'}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
