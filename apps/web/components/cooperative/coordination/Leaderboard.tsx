'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";

async function fetchLeaderboard() {
    const res = await fetch('/api/cooperative/leaderboard?limit=10');
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
}

export function Leaderboard() {
    const { data: members, isLoading, error } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: fetchLeaderboard
    });

    if (isLoading) return <div className="p-4 text-center">Loading leaderboard...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading leaderboard</div>;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Community Champions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members?.map((score: any, index: number) => (
                            <div key={score.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'text-muted-foreground'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={score.Member.photoUrl} alt={score.Member.firstName} />
                                        <AvatarFallback>{score.Member.firstName[0]}{score.Member.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{score.Member.firstName} {score.Member.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{score.Member.memberCode}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg flex items-center justify-end gap-1 text-primary">
                                        {score.totalXp} <span className="text-xs font-normal text-muted-foreground">XP</span>
                                    </div>
                                    <div className="flex gap-1 justify-end mt-1">
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                            {score.tasksCompleted} Tasks
                                        </Badge>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                            {score.proposalsVoted} Votes
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {members?.length === 0 && (
                            <div className="text-center p-8 text-muted-foreground">No data available.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
