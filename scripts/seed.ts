import { getDatabase } from '../lib/mongo';
import { pages, sites } from '../lib/seed-data';

async function seed() {
  const db = await getDatabase();
  const siteCollection = db.collection('sites');
  const pageCollection = db.collection('pages');
  await siteCollection.createIndex({ id: 1 }, { unique: true });
  await siteCollection.createIndex({ slug: 1 }, { unique: true });
  await pageCollection.createIndex({ id: 1 }, { unique: true });
  await pageCollection.createIndex({ siteId: 1, path: 1 }, { unique: true });

  for (const site of sites)
    await siteCollection.updateOne(
      { id: site.id },
      { $setOnInsert: site },
      { upsert: true },
    );
  for (const page of pages)
    await pageCollection.updateOne(
      { id: page.id },
      { $setOnInsert: page },
      { upsert: true },
    );
  console.log(
    `Seeded ${sites.length} sites and ${pages.length} starter pages (existing content preserved).`,
  );
  await db.client.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
