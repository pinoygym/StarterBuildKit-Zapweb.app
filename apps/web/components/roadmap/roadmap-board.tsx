"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoadmapItem } from "./types";
import { CreateItemDialog } from "./create-item-dialog";
import { ItemDetailView } from "./item-detail-view";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_COLUMNS = [
    { id: "PLANNED", label: "Planned" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "COMPLETED", label: "Completed" },
    { id: "ISSUE", label: "Issues / Bugs" },
];

export function RoadmapBoard() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

    const { data: items, isLoading } = useQuery<RoadmapItem[]>({
        queryKey: ["roadmap-items"],
        queryFn: async () => {
            const res = await fetch("/api/roadmap");
            if (!res.ok) throw new Error("Failed to fetch items");
            return res.json();
        },
    });

    const getItemsByStatus = (status: string) =>
        items?.filter((item) => item.status === status) || [];

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Project Roadmap & Updates</h2>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Item
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex h-full gap-4 min-w-[1000px] pb-4">
                    {STATUS_COLUMNS.map((column) => (
                        <div key={column.id} className="flex-1 flex flex-col min-w-[280px] bg-muted/30 rounded-lg p-2">
                            <div className="flex items-center justify-between p-2 mb-2 font-semibold">
                                {column.label}
                                <Badge variant="secondary">{getItemsByStatus(column.id).length}</Badge>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="space-y-3 p-1">
                                    {isLoading ? (
                                        <div className="text-center p-4 text-muted-foreground">Loading...</div>
                                    ) : getItemsByStatus(column.id).map((item) => (
                                        <Card
                                            key={item.id}
                                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] h-5 ${item.priority === "CRITICAL" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" : ""
                                                            }`}
                                                    >
                                                        {item.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {item.description}
                                                </p>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {item._count?.comments ? (
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <MessageSquare className="h-3 w-3 mr-1" />
                                                            {item._count.comments}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </div>

            <CreateItemDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            <ItemDetailView
                item={selectedItem}
                open={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
