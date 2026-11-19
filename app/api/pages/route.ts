import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isValidPagePath, normalizePath, type PageDocument } from '@/lib/model';
import { getPage, getPages, getSiteById, savePage } from '@/lib/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const siteId = new URL(request.url).searchParams.get('siteId') ?? undefined;
    return NextResponse.json(await getPages(siteId));
  } catch {
    return NextResponse.json({ error: 'Could not connect to MongoDB.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      siteId?: string;
      title?: string;
      path?: string;
    };
    const siteId = body.siteId?.trim();
    const title = body.title?.trim();
    const path = normalizePath(body.path ?? '');
    if (!siteId || !title || title.length > 120 || !isValidPagePath(path))
      return NextResponse.json(
        { error: 'Enter a title and a path using lowercase letters, numbers, and hyphens.' },
        { status: 400 },
      );
    if (!(await getSiteById(siteId)))
      return NextResponse.json({ error: 'Choose a valid site.' }, { status: 400 });
    if (await getPage(siteId, path))
      return NextResponse.json(
        { error: 'This site already has a page at that path.' },
        { status: 409 },
      );
    const page: PageDocument = {
      id: randomUUID(),
      siteId,
      title,
      path,
      schemaVersion: 1,
      status: 'published',
      components: [],
      updatedAt: new Date().toISOString(),
    };
    await savePage(page);
    return NextResponse.json(page, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Could not create page. Check that MongoDB is running.' },
      { status: 503 },
    );
  }
}
