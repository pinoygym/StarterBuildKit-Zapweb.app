'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';

import { MemberWithRelations, PaginationMetadata } from "@/types/cooperative-member.types";

interface MembersResponse {
    data: MemberWithRelations[];
    pagination: PaginationMetadata;
}

async function fetchMembers(search: string): Promise<MembersResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`/api/cooperative/members?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
}

export function MemberRegistry() {
    const [search, setSearch] = useState('');
    const router = useRouter();

    // Debounce could be added here, but for simplicity relying on reacts fast re-render or explicit submit if needed.
    // Actually, standard practice is query param change triggers refetch.

    const { data: members, isLoading } = useQuery({
        queryKey: ['members', search],
        queryFn: () => fetchMembers(search)
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Member Registry</h2>
                <Button onClick={() => router.push('/cooperative/members/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Register Member
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or code..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Photo</TableHead>
                                <TableHead>Member Info</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Membership</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8">Loading members...</TableCell></TableRow>
                            ) : members?.data?.map((member: MemberWithRelations) => (
                                <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/cooperative/members/${member.id}`)}>
                                    <TableCell>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.photoUrl || undefined} />
                                            <AvatarFallback>{member.firstName[0]}{member.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{member.memberCode || 'No Code'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{member.email}</div>
                                        <div className="text-xs text-muted-foreground">{member.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{member.MembershipType?.name || 'Standard'}</div>
                                        <div className="text-xs text-muted-foreground">Since {member.membershipDate ? format(new Date(member.membershipDate), 'MMM yyyy') : 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>{member.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && members?.data?.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No members found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
