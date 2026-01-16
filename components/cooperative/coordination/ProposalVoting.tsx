'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { SubmitProposalDialog } from "./SubmitProposalDialog";
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

async function fetchProposals() {
    const res = await fetch('/api/cooperative/proposals');
    if (!res.ok) throw new Error('Failed to fetch proposals');
    return res.json();
}

export function ProposalVoting() {
    const queryClient = useQueryClient();
    const [votingMemberId, setVotingMemberId] = React.useState<string>("");

    const { data: proposals, isLoading, error } = useQuery({
        queryKey: ['proposals'],
        queryFn: fetchProposals
    });

    const { data: membersResponse } = useQuery({
        queryKey: ['cooperative-members'],
        queryFn: async () => {
            const res = await fetch('/api/cooperative/members?limit=100');
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
    });

    const members = membersResponse?.data || [];

    const voteMutation = useMutation({
        mutationFn: async ({ proposalId, voteType }: { proposalId: string, voteType: 'approve' | 'reject' }) => {
            if (!votingMemberId) throw new Error('Please select a member to vote as');

            const res = await fetch(`/api/cooperative/proposals/${proposalId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: votingMemberId,
                    voteType
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to submit vote');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            toast.success('Vote recorded');
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    if (isLoading) return <div className="p-4 text-center">Loading proposals...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading proposals</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">Active Proposals</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Vote as:</span>
                        <Select value={votingMemberId} onValueChange={setVotingMemberId}>
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <SubmitProposalDialog />
            </div>

            <div className="grid gap-4">
                {proposals?.map((proposal: any) => {
                    const totalVotes = proposal._count?.Votes || 0;
                    const requiredVotes = proposal.requiredVotes || 1;
                    const progress = Math.min(100, (totalVotes / requiredVotes) * 100);

                    return (
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
                                        <span>Votes: {totalVotes} / {requiredVotes}</span>
                                        <span>{Math.round(progress)}% of required</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => voteMutation.mutate({ proposalId: proposal.id, voteType: 'reject' })}
                                    disabled={voteMutation.isPending}
                                >
                                    <ThumbsDown className="h-4 w-4" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => voteMutation.mutate({ proposalId: proposal.id, voteType: 'approve' })}
                                    disabled={voteMutation.isPending}
                                >
                                    {voteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                    Approve
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
                {proposals?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        No active proposals.
                    </div>
                )}
            </div>
        </div>
    );
}

