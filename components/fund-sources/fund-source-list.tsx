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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FundSourceWithBranch, FUND_SOURCE_TYPE_LABELS, FundSourceType } from '@/types/fund-source.types';
import { MoreHorizontal, Pencil, Trash2, ArrowRightLeft, Eye, Building2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FundSourceListProps {
    fundSources: FundSourceWithBranch[];
    isLoading?: boolean;
    onEdit?: (fundSource: FundSourceWithBranch) => void;
    onDelete?: (fundSource: FundSourceWithBranch) => void;
    onTransfer?: (fundSource: FundSourceWithBranch) => void;
    onView?: (fundSource: FundSourceWithBranch) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
    BANK_ACCOUNT: <Building2 className="h-4 w-4" />,
    CASH_REGISTER: <Wallet className="h-4 w-4" />,
    PETTY_CASH: <Wallet className="h-4 w-4" />,
    MOBILE_WALLET: <Wallet className="h-4 w-4" />,
    CREDIT_LINE: <Building2 className="h-4 w-4" />,
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    closed: 'destructive',
};

export function FundSourceList({
    fundSources,
    isLoading,
    onEdit,
    onDelete,
    onTransfer,
    onView,
}: FundSourceListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (fundSources.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No fund sources found</p>
                <p className="text-sm">Create your first fund source to start tracking finances.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fund Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Current Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fundSources.map((fundSource) => (
                        <TableRow key={fundSource.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {typeIcons[fundSource.type] || <Wallet className="h-4 w-4" />}
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {fundSource.name}
                                            {fundSource.isDefault && (
                                                <Badge variant="outline" className="text-xs">Default</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{fundSource.code}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    {FUND_SOURCE_TYPE_LABELS[fundSource.type as FundSourceType] || fundSource.type}
                                </div>
                                {fundSource.bankName && (
                                    <div className="text-xs text-muted-foreground">{fundSource.bankName}</div>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {fundSource.Branch?.name || 'Company-wide'}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={`font-medium ${fundSource.currentBalance < 0 ? 'text-destructive' : ''}`}>
                                    {formatCurrency(fundSource.currentBalance)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusColors[fundSource.status] || 'outline'}>
                                    {fundSource.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onView && (
                                            <DropdownMenuItem onClick={() => onView(fundSource)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                        )}
                                        {onTransfer && (
                                            <DropdownMenuItem onClick={() => onTransfer(fundSource)}>
                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                Transfer
                                            </DropdownMenuItem>
                                        )}
                                        {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(fundSource)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <DropdownMenuItem
                                                onClick={() => onDelete(fundSource)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Close
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
