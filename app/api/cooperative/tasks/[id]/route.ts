import { NextRequest, NextResponse } from "next/server";
import { cooperativeTaskService } from "@/services/cooperative-task.service";
import { getServerSession } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const task = await cooperativeTaskService.getTaskById(id);
        return NextResponse.json(task);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "Task not found" ? 404 : 500 });
    }
}
