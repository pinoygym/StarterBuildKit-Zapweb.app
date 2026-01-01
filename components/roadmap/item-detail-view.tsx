"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RoadmapItem } from "./types";
import { CommentFeed } from "./comment-feed";
import { formatDistanceToNow } from "date-fns";

interface ItemDetailViewProps {
    item: RoadmapItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ItemDetailView({ item, open, onOpenChange }: ItemDetailViewProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={item.priority === "CRITICAL" ? "destructive" : "secondary"}>
                            {item.priority}
                        </Badge>
                        <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
                    </div>
                    <DialogTitle className="text-xl">{item.title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <span>By {item.Author.firstName} {item.Author.lastName}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>

                    <div className="prose dark:prose-invert text-sm mb-8 whitespace-pre-wrap">
                        {item.description}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4">Comments</h3>
                        <CommentFeed roadmapItemId={item.id} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
