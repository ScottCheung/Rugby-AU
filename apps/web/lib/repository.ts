import { getDb } from './db/client';
import type { PageDocument, Site } from './model';

/** Never leak Mongo's ObjectId into JSON or Client Components. */
const withoutMongoId = { projection: { _id: 0 } } as const;

async function collections() {
  const db = await getDb();
  return {
    sites: db.collection<Site>('sites'),
    pages: db.collection<PageDocument>('pages'),
  };
}

export async function getSites() {
  const { sites } = await collections();
  return sites.find({}, withoutMongoId).sort({ name: 1 }).toArray();
}

export async function getSiteById(id: string) {
  const { sites } = await collections();
  return sites.findOne({ id }, withoutMongoId);
}

export async function getSiteBySlug(slug: string) {
  const { sites } = await collections();
  return sites.findOne({ slug }, withoutMongoId);
}

export async function getPages(siteId?: string) {
  const { pages } = await collections();
  return pages
    .find(siteId ? { siteId } : {}, withoutMongoId)
    .sort({ path: 1 })
    .toArray();
}

export async function getPageById(id: string) {
  const { pages } = await collections();
  return pages.findOne({ id }, withoutMongoId);
}

/** Resolved by the unique (siteId, path) index. */
export async function getPage(siteId: string, path: string) {
  const { pages } = await collections();
  return pages.findOne({ siteId, path }, withoutMongoId);
}

export async function savePage(page: PageDocument) {
  const { pages } = await collections();
  await pages.updateOne({ id: page.id }, { $set: page }, { upsert: true });
  return page;
}
