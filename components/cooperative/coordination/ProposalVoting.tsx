'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { format } from "date-fns";

async function fetchProposals() {
    const res = await fetch('/api/cooperative/proposals');
    if (!res.ok) throw new Error('Failed to fetch proposals');
    return res.json();
}

export function ProposalVoting() {
    const { data: proposals, isLoading, error } = useQuery({
        queryKey: ['proposals'],
        queryFn: fetchProposals
    });

    if (isLoading) return <div className="p-4 text-center">Loading proposals...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading proposals</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Proposals</h3>
                <Button size="sm">Submit Proposal</Button>
            </div>

            <div className="grid gap-4">
                {proposals?.map((proposal: any) => (
                    <Card key={proposal.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{proposal.category}</Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {proposal.votingEndDate ? `Ends ${format(new Date(proposal.votingEndDate), 'MMM d')}` : 'No deadline'}
                                    </span>
                                </div>
                                <Badge>{proposal.status}</Badge>
                            </div>
                            <CardTitle className="text-lg mt-2">{proposal.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <p className="text-sm text-muted-foreground">{proposal.description}</p>

                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Votes: {proposal._count?.Votes || 0} / {proposal.requiredVotes || 'No limit'}</span>
                                    <span>Progress</span>
                                </div>
                                {/* Mock progress for now */}
                                <Progress value={33} className="h-2" />
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ThumbsDown className="h-4 w-4" /> Reject
                            </Button>
                            <Button size="sm" className="gap-2">
                                <ThumbsUp className="h-4 w-4" /> Approve
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {proposals?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">No active proposals.</div>
                )}
            </div>
        </div>
    );
}
