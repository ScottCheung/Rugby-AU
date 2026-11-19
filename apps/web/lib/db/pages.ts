import { MongoServerError, ObjectId } from 'mongodb';
import type { ComponentNode, Page } from '../types';
import { getDb } from './client';
import { PAGES, type PageDocument } from './documents';

function toPage({ _id, updatedAt, ...page }: PageDocument): Page {
  return { id: _id.toHexString(), updatedAt: updatedAt.toISOString(), ...page };
}

async function pages() {
  const db = await getDb();
  return db.collection<PageDocument>(PAGES);
}

export async function listPages(siteSlug: string): Promise<Page[]> {
  const found = await (
    await pages()
  )
    .find({ siteSlug })
    .sort({ path: 1 })
    .toArray();
  return found.map(toPage);
}

/** Number of pages per site slug, for the manager's site list. */
export async function countPagesBySite(): Promise<Record<string, number>> {
  const rows = await (
    await pages()
  )
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$siteSlug', count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** The renderer's lookup. Uses the unique { siteSlug, path } index. */
export async function getPageByPath(
  siteSlug: string,
  path: string,
): Promise<Page | null> {
  const page = await (await pages()).findOne({ siteSlug, path });
  return page ? toPage(page) : null;
}

export async function getPageById(id: string): Promise<Page | null> {
  if (!ObjectId.isValid(id)) return null;
  const page = await (await pages()).findOne({ _id: new ObjectId(id) });
  return page ? toPage(page) : null;
}

export type CreatePageResult =
  { ok: true; page: Page } | { ok: false; reason: 'duplicate-path' };

export async function createPage(input: {
  siteSlug: string;
  path: string;
  title: string;
}): Promise<CreatePageResult> {
  const document: PageDocument = {
    _id: new ObjectId(),
    ...input,
    tree: [],
    updatedAt: new Date(),
  };
  try {
    await (await pages()).insertOne(document);
    return { ok: true, page: toPage(document) };
  } catch (error) {
    // 11000 = duplicate key: the site already has a page at this path.
    if (error instanceof MongoServerError && error.code === 11000)
      return { ok: false, reason: 'duplicate-path' };
    throw error;
  }
}

export async function updatePage(
  id: string,
  changes: { title: string; description?: string; tree: ComponentNode[] },
): Promise<Page | null> {
  if (!ObjectId.isValid(id)) return null;
  const { description, ...rest } = changes;
  const updated = await (
    await pages()
  ).findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...rest,
        updatedAt: new Date(),
        ...(description ? { description } : {}),
      },
      ...(description ? {} : { $unset: { description: '' } }),
    },
    { returnDocument: 'after' },
  );
  return updated ? toPage(updated) : null;
}
