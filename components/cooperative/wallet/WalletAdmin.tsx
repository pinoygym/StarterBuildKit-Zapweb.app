'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";

async function fetchWalletStats() {
    const res = await fetch('/api/cooperative/wallets?view=stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

async function fetchWallets() {
    const res = await fetch('/api/cooperative/wallets');
    if (!res.ok) throw new Error('Failed to fetch wallets');
    return res.json();
}

export function WalletAdmin() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['wallet-stats'],
        queryFn: fetchWalletStats
    });

    const { data: wallets, isLoading: walletsLoading } = useQuery({
        queryKey: ['wallets'],
        queryFn: fetchWallets
    });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    };

    if (statsLoading || walletsLoading) return <div className="p-4">Loading wallet data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">E-Wallet Admin</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(stats?.totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">Across all member wallets</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Share Capital</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(stats?.totalShareCapital)}</div>
                        <p className="text-xs text-muted-foreground">Total accumulated shares</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeWallets || 0}</div>
                        <p className="text-xs text-muted-foreground">Members with active wallets</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Share Capital</TableHead>
                                <TableHead>Savings</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wallets?.map((wallet: any) => (
                                <TableRow key={wallet.id}>
                                    <TableCell>
                                        <div className="font-medium">{wallet.Member?.firstName} {wallet.Member?.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{wallet.Member?.memberCode}</div>
                                    </TableCell>
                                    <TableCell>{formatMoney(wallet.walletBalance)}</TableCell>
                                    <TableCell>{formatMoney(wallet.shareCapital)}</TableCell>
                                    <TableCell>{formatMoney(wallet.savingsBalance)}</TableCell>
                                    <TableCell><Badge variant={wallet.status === 'active' ? 'default' : 'secondary'}>{wallet.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                            {wallets?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No wallets found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
