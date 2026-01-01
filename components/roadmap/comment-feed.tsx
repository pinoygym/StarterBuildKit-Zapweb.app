"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoadmapComment } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface CommentFeedProps {
    roadmapItemId: string;
}

export function CommentFeed({ roadmapItemId }: CommentFeedProps) {
    const [content, setContent] = useState("");
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery<RoadmapComment[]>({
        queryKey: ["roadmap-comments", roadmapItemId],
        queryFn: async () => {
            const res = await fetch(`/api/roadmap/${roadmapItemId}/comments`);
            if (!res.ok) throw new Error("Failed to fetch comments");
            return res.json();
        },
    });

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(`/api/roadmap/${roadmapItemId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            });
            if (!res.ok) throw new Error("Failed to post comment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roadmap-comments", roadmapItemId] });
            queryClient.invalidateQueries({ queryKey: ["roadmap-items"] }); // Update comment count
            setContent("");
            toast.success("Comment posted");
        },
        onError: () => {
            toast.error("Failed to post comment");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        mutation.mutate(content);
    };

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading comments...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 min-h-[200px] max-h-[400px]">
                {comments?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No comments yet. Start the discussion!
                    </div>
                ) : (
                    comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{comment.User.firstName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{comment.User.firstName} {comment.User.lastName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-foreground/90">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 border-t pt-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[40px] max-h-[100px]"
                    />
                    <Button type="submit" size="icon" disabled={mutation.isPending || !content.trim()}>
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
