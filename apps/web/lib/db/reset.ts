import { getDb } from './client';
import {
  PAGES,
  SITES,
  type PageDocument,
  type SiteDocument,
} from './documents';

/**
 * Seed helper: drop and recreate both collections with their indexes, then
 * insert the given documents. Running it twice gives the same result.
 */
export async function resetDatabase(data: {
  sites: Omit<SiteDocument, '_id'>[];
  pages: Omit<PageDocument, '_id'>[];
}) {
  const db = await getDb();
  for (const name of [SITES, PAGES]) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) await db.collection(name).drop();
  }

  const sites = db.collection<Omit<SiteDocument, '_id'>>(SITES);
  const pages = db.collection<Omit<PageDocument, '_id'>>(PAGES);
  await sites.createIndex({ slug: 1 }, { unique: true });
  await pages.createIndex({ siteSlug: 1, path: 1 }, { unique: true });

  await sites.insertMany(data.sites);
  await pages.insertMany(data.pages);
}
