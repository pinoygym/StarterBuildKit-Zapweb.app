import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Roadmap & Updates | InventoryPro",
    description: "Project roadmap, feature requests, and issue tracking.",
};

export default function RoadmapPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
            <RoadmapBoard />
        </div>
    );
}
