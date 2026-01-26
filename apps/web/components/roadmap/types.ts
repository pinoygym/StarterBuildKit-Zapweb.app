export interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ISSUE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    tags: string[];
    targetDate?: string;
    createdAt: string;
    updatedAt: string;
    Author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
    };
    _count?: {
        comments: number;
    };
}

export interface RoadmapComment {
    id: string;
    content: string;
    createdAt: string;
    User: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
    };
}
