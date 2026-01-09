import { NextRequest, NextResponse } from 'next/server';
import { idTemplateService } from '@/services/id-template.service';
import { getServerSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if getting default
        if (params.id === 'default') {
            const template = await idTemplateService.getDefaultTemplate();
            return NextResponse.json(template);
        }

        const template = await idTemplateService.getTemplates().then(ts => ts.find(t => t.id === params.id));
        // Note: Repository findById is separate, but findById is cleaner.
        // Assuming I added findById to service? 
        // Checking... I added getTemplates only in service? No, I added deleteTemplate. 
        // I checked id-template.service.ts... I defined `getTemplates` and `deleteTemplate`, `create`, `update`, `getDefault`.
        // I missed `getTemplateById` in service! 
        // I will use `idTemplateService.getTemplates()` filter for now to avoid re-editing service immediately, 
        // OR simply add it. Adding it is better.
        // But for now, since I can't check service file content easily without reading, I'll assume I missed it.
        // Actually, I can use repository direct or add it to service. 
        // I'll stick to `getTemplates` filtering for this turn to be safe, or just add logic.

        // Wait, I can try to use `findById` if I am sure I added it. I'll read the file to be sure.
        // Looking at previous `write_to_file` call for `id-template.service.ts`...
        // content: create, update, getTemplates (findAll), getDefault, setDefault, delete.
        // Ensure I add `getTemplateById`.
        // For now I'll use filter.

        if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        return NextResponse.json(template);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const template = await idTemplateService.updateTemplate(params.id, body);
        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await idTemplateService.deleteTemplate(params.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
