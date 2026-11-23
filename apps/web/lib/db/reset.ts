import { ObjectId } from 'mongodb';
import type { ComponentNode } from '../types';
import { getDb } from './client';
import type { CollectionId } from '../collections';
import {
  ENTRIES,
  PAGE_VERSIONS,
  PAGES,
  SITES,
  type EntryDocument,
  type PageDocument,
  type PageVersionDocument,
  type SiteDocument,
} from './documents';
import { ensureIndexes } from './indexes';

/** A page as the seed writes it; it is published as version 1. */
export type SeedPage = {
  siteSlug: string;
  path: string;
  title: string;
  description?: string;
  /** Set on the page that draws every entry of a collection. */
  template?: CollectionId;
  tree: ComponentNode[];
};

/** An entry as the seed writes it; it is published. */
export type SeedEntry = {
  siteSlug: string;
  collection: CollectionId;
  slug: string;
  data: Record<string, unknown>;
};

/**
 * Seed helper: drop and recreate the collections with their indexes, then
 * insert the given sites and pages, every page published once. Running it
 * twice gives the same result.
 */
export async function resetDatabase(data: {
  sites: Omit<SiteDocument, '_id'>[];
  pages: SeedPage[];
  entries?: SeedEntry[];
}) {
  const db = await getDb();
  for (const name of [SITES, PAGES, PAGE_VERSIONS, ENTRIES]) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) await db.collection(name).drop();
  }
  await ensureIndexes(db);

  const now = new Date();
  const pages: PageDocument[] = data.pages.map(
    ({ siteSlug, path, title, description, template, tree }) => {
      const content = {
        title,
        ...(description ? { description } : {}),
        components: tree,
      };
      return {
        _id: new ObjectId(),
        siteSlug,
        path,
        ...(template ? { template } : {}),
        draft: content,
        published: { ...content, version: 1, publishedAt: now },
        updatedAt: now,
      };
    },
  );
  const versions: PageVersionDocument[] = pages.map((page) => ({
    _id: new ObjectId(),
    pageId: page._id,
    ...page.published!,
  }));

  await db.collection<Omit<SiteDocument, '_id'>>(SITES).insertMany(data.sites);
  await db.collection<PageDocument>(PAGES).insertMany(pages);
  await db.collection<PageVersionDocument>(PAGE_VERSIONS).insertMany(versions);
  if (data.entries?.length)
    await db.collection<EntryDocument>(ENTRIES).insertMany(
      data.entries.map((entry) => ({
        _id: new ObjectId(),
        ...entry,
        status: 'published' as const,
        updatedAt: now,
      })),
    );
}
