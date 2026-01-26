import { NextRequest, NextResponse } from "next/server";
import { idTemplateService } from "@/services/id-template.service";
import { getServerSession } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (id === "default") {
            const template = await idTemplateService.getDefaultTemplate();
            return NextResponse.json(template);
        }

        const templates = await idTemplateService.getTemplates();
        const template = templates.find(t => t.id === id);

        if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
        return NextResponse.json(template);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const template = await idTemplateService.updateTemplate(id, body);
        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await idTemplateService.deleteTemplate(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
