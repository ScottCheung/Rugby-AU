import type { Db } from 'mongodb';
import { PAGE_VERSIONS, PAGES, SITES } from './documents';

/**
 * Every index the app relies on. Safe to run again: MongoDB ignores an
 * index that already exists.
 */
export async function ensureIndexes(db: Db) {
  await db.collection(SITES).createIndex({ slug: 1 }, { unique: true });
  // The renderer's lookup, and one page per address on a site.
  await db
    .collection(PAGES)
    .createIndex({ siteSlug: 1, path: 1 }, { unique: true });
  // A page's history, newest first; also stops two publishes taking the
  // same version number.
  await db
    .collection(PAGE_VERSIONS)
    .createIndex({ pageId: 1, version: -1 }, { unique: true });
}
