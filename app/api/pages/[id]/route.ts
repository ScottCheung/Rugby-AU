import { NextResponse } from 'next/server';
import { getPages, getSites, savePage } from '@/lib/repository';
import { isValidComponentTree, type PageDocument } from '@/lib/model';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<PageDocument>;
    const [page] = (await getPages()).filter((item) => item.id === id);
    if (!page)
      return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
    if (
      body.siteId !== page.siteId ||
      body.id !== id ||
      typeof body.title !== 'string' ||
      body.title.trim().length > 120 ||
      !isValidComponentTree(body.components)
    ) {
      return NextResponse.json(
        { error: 'The page document is invalid.' },
        { status: 400 },
      );
    }
    const sites = await getSites();
    if (!sites.some((site) => site.id === page.siteId))
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    const updated: PageDocument = {
      ...page,
      title: body.title.trim() || page.title,
      path: page.path,
      status: 'published',
      components: body.components,
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
