import { authService } from "@/services/auth.service";
import { roadmapService } from "@/services/roadmap.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const comments = await roadmapService.getComments(id);

        return NextResponse.json(comments);
    } catch (error) {
        console.error("[ROADMAP_COMMENTS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse("Missing content", { status: 400 });
        }

        const comment = await roadmapService.addComment({
            content,
            roadmapItemId: id,
            userId: payload.userId,
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("[ROADMAP_COMMENTS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
