'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Trophy, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

async function fetchTasks() {
    const res = await fetch('/api/cooperative/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export function TaskBoard() {
    const queryClient = useQueryClient();
    const [assigneeId, setAssigneeId] = React.useState<string>("");

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks'],
        queryFn: fetchTasks
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

    const assignMutation = useMutation({
        mutationFn: async ({ taskId }: { taskId: string }) => {
            if (!assigneeId) throw new Error('Please select a member to accept as');

            const res = await fetch(`/api/cooperative/tasks/${taskId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: assigneeId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to assign task');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Mission accepted!');
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    if (isLoading) return <div className="p-4 text-center">Loading tasks...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading tasks</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">Available Missions</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Member:</span>
                        <Select value={assigneeId} onValueChange={setAssigneeId}>
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
                <CreateTaskDialog />
            </div>

            <div className="space-y-3">
                {tasks?.map((task: any) => (
                    <Card key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{task.title}</h4>
                                <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                                {task.xpReward > 0 && (
                                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 flex items-center gap-1">
                                        <Trophy className="h-3 w-3" /> {task.xpReward} XP
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">{task.status}</Badge>
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
                            <Button
                                size="sm"
                                onClick={() => assignMutation.mutate({ taskId: task.id })}
                                disabled={assignMutation.isPending || task.status === 'completed' || task.status === 'cancelled'}
                            >
                                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Accept Mission
                            </Button>
                        </div>
                    </Card>
                ))}
                {tasks?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        No active tasks.
                    </div>
                )}
            </div>
        </div>
    );
}

