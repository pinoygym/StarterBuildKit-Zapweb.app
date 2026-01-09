'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Target } from "lucide-react";
import { format } from "date-fns";

async function fetchInitiatives() {
    const res = await fetch('/api/cooperative/initiatives');
    if (!res.ok) throw new Error('Failed to fetch initiatives');
    return res.json();
}

export function InitiativesList() {
    const { data: initiatives, isLoading, error } = useQuery({
        queryKey: ['initiatives'],
        queryFn: fetchInitiatives
    });

    if (isLoading) return <div className="p-4 text-center">Loading initiatives...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading initiatives</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Initiatives</h3>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Initiative</Button>
            </div>

            {initiatives?.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    No initiatives found. Start a new one!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {initiatives?.map((item: any) => (
                        <Card key={item.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="text-base font-semibold line-clamp-1">{item.title}</CardTitle>
                                    <Badge variant={item.status === 'active' ? 'default' : 'outline'}>{item.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{item.description}</p>
                                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-3 w-3" />
                                        <span className="capitalize">{item.category}</span>
                                    </div>
                                    {item.targetDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            <span>{format(new Date(item.targetDate), 'PPP')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
