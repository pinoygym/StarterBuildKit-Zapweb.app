'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InitiativesList } from "./InitiativesList";
import { ProposalVoting } from "./ProposalVoting";
import { TaskBoard } from "./TaskBoard";
import { Leaderboard } from "./Leaderboard";

export function CoordinationCenter() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Coordination Center</h2>
            </div>
            <Tabs defaultValue="initiatives" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
                    <TabsTrigger value="decision-room">Decision Room</TabsTrigger>
                    <TabsTrigger value="task-force">Task Force</TabsTrigger>
                    <TabsTrigger value="leaderboard">Top Contributors</TabsTrigger>
                </TabsList>
                <TabsContent value="initiatives" className="space-y-4">
                    <InitiativesList />
                </TabsContent>
                <TabsContent value="decision-room" className="space-y-4">
                    <ProposalVoting />
                </TabsContent>
                <TabsContent value="task-force" className="space-y-4">
                    <TaskBoard />
                </TabsContent>
                <TabsContent value="leaderboard" className="space-y-4">
                    <Leaderboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
