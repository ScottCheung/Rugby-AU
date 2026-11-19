import type { Collection } from 'mongodb';
import { getDatabase } from './mongo';
import type { PageDocument, Site } from './model';

export async function getSites() {
  const db = await getDatabase();
  return db.collection<Site>('sites').find({}).sort({ name: 1 }).toArray();
}

export async function getPages(siteId?: string) {
  const db = await getDatabase();
  const query = siteId ? { siteId } : {};
  return db
    .collection<PageDocument>('pages')
    .find(query)
    .sort({ path: 1 })
    .toArray();
}

export async function getPage(siteId: string, path: string) {
  const db = await getDatabase();
  return db.collection<PageDocument>('pages').findOne({ siteId, path });
}

export async function savePage(page: PageDocument) {
  const db = await getDatabase();
  const pages: Collection<PageDocument> = db.collection('pages');
  await pages.updateOne({ id: page.id }, { $set: page }, { upsert: true });
  return page;
}
