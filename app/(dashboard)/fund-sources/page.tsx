'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFundSources, useFundSourcesSummary, useDeleteFundSource } from '@/hooks/use-fund-sources';
import { useBranches } from '@/hooks/use-branches';
import { FundSourceList } from '@/components/fund-sources/fund-source-list';
import { FundSourceForm } from '@/components/fund-sources/fund-source-form';
import { FundTransferDialog } from '@/components/fund-sources/fund-transfer-dialog';
import { FundSourceWithBranch, FUND_SOURCE_TYPE_LABELS, FundSourceType } from '@/types/fund-source.types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Plus,
    ArrowRightLeft,
    Search,
    Wallet,
    Building2,
    CreditCard,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FundSourcesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [branchFilter, setBranchFilter] = useState<string>('');
    const [formOpen, setFormOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [editingFundSource, setEditingFundSource] = useState<FundSourceWithBranch | null>(null);
    const [transferFromId, setTransferFromId] = useState<string | undefined>();

    const { data: branches = [] } = useBranches();
    const { data: fundSources = [], isLoading, refetch } = useFundSources({
        search: searchQuery || undefined,
        type: typeFilter as FundSourceType || undefined,
        branchId: branchFilter || undefined,
    });
    const { data: summary } = useFundSourcesSummary(branchFilter || undefined);
    const deleteMutation = useDeleteFundSource();

    const handleEdit = (fundSource: FundSourceWithBranch) => {
        setEditingFundSource(fundSource);
        setFormOpen(true);
    };

    const handleDelete = async (fundSource: FundSourceWithBranch) => {
        if (confirm(`Are you sure you want to close "${fundSource.name}"? This action cannot be undone.`)) {
            try {
                await deleteMutation.mutateAsync(fundSource.id);
                toast.success('Fund source closed successfully');
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to close fund source');
            }
        }
    };

    const handleTransfer = (fundSource: FundSourceWithBranch) => {
        setTransferFromId(fundSource.id);
        setTransferOpen(true);
    };

    const handleView = (fundSource: FundSourceWithBranch) => {
        router.push(`/fund-sources/${fundSource.id}`);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingFundSource(null);
    };

    const handleTransferClose = () => {
        setTransferOpen(false);
        setTransferFromId(undefined);
    };

    // Calculate summary stats
    const totalBalance = summary?.summary?.totalBalance || 0;
    const bankBalance = summary?.summary?.byType?.find((t: { type: string }) => t.type === 'BANK_ACCOUNT')?.totalBalance || 0;
    const cashBalance = (summary?.summary?.byType || [])
        .filter((t: { type: string }) => ['CASH_REGISTER', 'PETTY_CASH'].includes(t.type))
        .reduce((sum: number, t: { totalBalance: number }) => sum + t.totalBalance, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fund Sources</h1>
                    <p className="text-muted-foreground">
                        Manage your bank accounts, cash registers, and other fund sources.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setTransferOpen(true)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer
                    </Button>
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fund Source
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {summary?.summary?.totalFundSources || 0} fund sources
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(bankBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.summary?.byType?.find((t: { type: string }) => t.type === 'BANK_ACCOUNT')?.count || 0} accounts
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(cashBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Cash registers & petty cash
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary?.recentTransactions?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Transactions today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Fund Sources</CardTitle>
                    <CardDescription>
                        View and manage all your fund sources.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search fund sources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(FUND_SOURCE_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={branchFilter || 'all'} onValueChange={(v) => setBranchFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((branch: { id: string; name: string }) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <FundSourceList
                        fundSources={fundSources}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTransfer={handleTransfer}
                        onView={handleView}
                    />
                </CardContent>
            </Card>

            {/* Dialogs */}
            <FundSourceForm
                open={formOpen}
                onClose={handleFormClose}
                fundSource={editingFundSource}
            />

            <FundTransferDialog
                open={transferOpen}
                onClose={handleTransferClose}
                defaultFromId={transferFromId}
            />
        </div>
    );
}
