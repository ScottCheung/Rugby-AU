import { parseComponentTree } from '../lib/components/registry';
import { getDatabase } from '../lib/mongo';
import { pages, sites } from '../lib/seed-data';

async function seed() {
  // Seed pages go through the same validation as editor saves.
  for (const page of pages) {
    const result = parseComponentTree(page.components);
    if (!result.ok)
      throw new Error(
        `Seed page ${page.id} is invalid: ${JSON.stringify(result.issues, null, 2)}`,
      );
    page.components = result.components;
  }

  const db = await getDatabase();
  const siteCollection = db.collection('sites');
  const pageCollection = db.collection('pages');
  await siteCollection.createIndex({ id: 1 }, { unique: true });
  await siteCollection.createIndex({ slug: 1 }, { unique: true });
  await pageCollection.createIndex({ id: 1 }, { unique: true });
  await pageCollection.createIndex({ siteId: 1, path: 1 }, { unique: true });

  // Sites are owned by the seed (not editable in the manager): always update.
  for (const site of sites)
    await siteCollection.updateOne(
      { id: site.id },
      { $set: site },
      { upsert: true },
    );
  // Pages are owned by editors: only fill routes that are still empty, never
  // overwrite edits (or a page an editor already created at the same path).
  for (const page of pages)
    await pageCollection.updateOne(
      { siteId: page.siteId, path: page.path },
      { $setOnInsert: page },
      { upsert: true },
    );
  console.log(
    `Seeded ${sites.length} sites and ${pages.length} starter pages (existing pages preserved).`,
  );
  await db.client.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
