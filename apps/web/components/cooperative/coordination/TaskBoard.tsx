'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";

async function fetchTasks() {
    const res = await fetch('/api/cooperative/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export function TaskBoard() {
    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks'],
        queryFn: fetchTasks
    });

    if (isLoading) return <div className="p-4 text-center">Loading tasks...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading tasks</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Available Missions</h3>
                <Button size="sm">Create Task</Button>
            </div>

            <div className="space-y-3">
                {tasks?.map((task: any) => (
                    <Card key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{task.title}</h4>
                                <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                                {task.xpReward > 0 && (
                                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 flex items-center gap-1">
                                        <Trophy className="h-3 w-3" /> {task.xpReward} XP
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                {task.dueDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Due {format(new Date(task.dueDate), 'MMM d')}
                                    </span>
                                )}
                                <span>{task.Assignments?.length || 0} assigned</span>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 flex gap-2">
                            <Button size="sm" variant="outline">Details</Button>
                            <Button size="sm">Accept Mission</Button>
                        </div>
                    </Card>
                ))}
                {tasks?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">No active tasks.</div>
                )}
            </div>
        </div>
    );
}
