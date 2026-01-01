import { authService } from "@/services/auth.service"; // Rebuild trigger
import { roadmapService } from "@/services/roadmap.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || undefined;
        const priority = searchParams.get("priority") || undefined;

        const items = await roadmapService.getItems({ status, priority });

        return NextResponse.json(items);
    } catch (error) {
        console.error("[ROADMAP_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, description, status, priority, tags, targetDate } = body;

        if (!title || !description) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const item = await roadmapService.createItem({
            title,
            description,
            status: status || "PLANNED",
            priority: priority || "MEDIUM",
            authorId: payload.userId,
            tags,
            targetDate: targetDate ? new Date(targetDate) : null,
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("[ROADMAP_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
