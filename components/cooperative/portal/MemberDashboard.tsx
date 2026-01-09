"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, User, Wallet, Leaf, ShieldCheck, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MemberDashboard() {
    const router = useRouter();

    const { data, isLoading, error } = useQuery({
        queryKey: ['memberProfile'],
        queryFn: async () => {
            const res = await fetch('/api/cooperative/me');
            if (res.status === 401) {
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        retry: false
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;

    if (error || !data?.success) {
        if (error?.message === "Unauthorized") {
            router.push("/portal/login"); // Automated redirect
            return <div className="text-center p-8">Redirecting to login...</div>;
        }
        return <div className="text-red-500 text-center p-8">Failed to load profile. Please try logging in again.</div>;
    }

    const member = data.data;

    return (
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-xl shadow-sm border">
                <Avatar className="h-20 w-20 border-2 border-emerald-100">
                    <AvatarImage src={member.photoUrl} alt={member.firstName} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xl font-bold">
                        {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-bold text-slate-800">Welcome, {member.firstName} {member.lastName}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-slate-500">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                            {member.MembershipType?.name || 'Member'}
                        </Badge>
                        <span>•</span>
                        <span>Member since {new Date(member.joinDate).getFullYear()}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant="outline">Edit Profile</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Share Capital</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">₱{member.Wallet?.shareCapital.toLocaleString() || '0.00'}</div>
                        <p className="text-xs text-emerald-600 mt-1">Ownership Value</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Wallet Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">₱{member.Wallet?.balance.toLocaleString() || '0.00'}</div>
                        <p className="text-xs text-blue-600 mt-1">Available Funds</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Patronage Refund</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">₱0.00</div>
                        <p className="text-xs text-amber-600 mt-1">Pending Distribution</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Farm Size</CardTitle>
                        <Leaf className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">{member.Farms?.length || 0}</div>
                        <p className="text-xs text-purple-600 mt-1">Registered Farms</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Tasks Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My Tasks</CardTitle>
                        <CardDescription>Pending cooperative assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Fetch tasks here */}
                        <div className="text-sm text-slate-500 italic">No pending tasks.</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Wallet history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Fetch transactions here */}
                        <div className="text-sm text-slate-500 italic">No recent transactions.</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
