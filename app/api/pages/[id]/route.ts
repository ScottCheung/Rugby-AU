import { NextResponse } from 'next/server';
import { parseComponentTree } from '@/lib/components/registry';
import type { PageDocument } from '@/lib/model';
import { getPageById, savePage } from '@/lib/repository';

export const dynamic = 'force-dynamic';

/** Replace a page's title and component tree. Site and path are immutable here. */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<PageDocument>;
    const page = await getPageById(id);
    if (!page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 120)
      return NextResponse.json(
        { error: 'Give the page a title (up to 120 characters).' },
        { status: 400 },
      );

    const tree = parseComponentTree(body.components);
    if (!tree.ok)
      return NextResponse.json(
        { error: 'Some components need attention before saving.', issues: tree.issues },
        { status: 400 },
      );

    const updated: PageDocument = {
      ...page,
      title,
      schemaVersion: 1,
      components: tree.components,
      updatedAt: new Date().toISOString(),
    };
    await savePage(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Could not save page. Check that MongoDB is running.' },
      { status: 503 },
    );
  }
}
