import { ObjectId, type Document } from 'mongodb';
import { closeDb, getDb } from '../lib/db/client';
import {
  PAGE_VERSIONS,
  PAGES,
  type PageDocument,
  type PageVersionDocument,
} from '../lib/db/documents';
import { ensureIndexes } from '../lib/db/indexes';

/**
 * One-off migration to draft/publish. A page stored before it has
 * { title, description, tree } at the top level and was live as soon as it
 * was saved, so it becomes draft = published = that content, version 1.
 * Pages already migrated are left alone, so it is safe to run again.
 */
async function migrate() {
  const db = await getDb();
  await ensureIndexes(db);
  const pages = db.collection(PAGES);
  const legacy = await pages.find({ draft: { $exists: false } }).toArray();

  for (const old of legacy as Document[]) {
    const content = {
      title: String(old.title ?? 'Untitled page'),
      ...(old.description ? { description: String(old.description) } : {}),
      components: Array.isArray(old.tree) ? old.tree : [],
    };
    const publishedAt: Date =
      old.updatedAt instanceof Date ? old.updatedAt : new Date();
    const published = { ...content, version: 1, publishedAt };
    await db
      .collection<PageVersionDocument>(PAGE_VERSIONS)
      .updateOne(
        { pageId: old._id as ObjectId, version: 1 },
        {
          $setOnInsert: { _id: new ObjectId(), pageId: old._id, ...published },
        },
        { upsert: true },
      );
    await db.collection<PageDocument>(PAGES).updateOne(
      { _id: old._id as ObjectId },
      {
        $set: { draft: content, published },
        $unset: { title: '', description: '', tree: '' },
      },
    );
  }
  console.log(`Migrated ${legacy.length} page(s) to draft/publish.`);
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDb);
