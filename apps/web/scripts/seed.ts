import { validateEntry, type CollectionId } from '../lib/collections';
import { validateTree } from '../lib/components/validateTree';
import { closeDb } from '../lib/db/client';
import { resetDatabase } from '../lib/db/reset';
import { readSeed } from './seed/read';
import { sites } from './seed/sites';

/** Idempotent: drops and recreates the collections every time it runs. */
async function seed() {
  const { pages, entries } = readSeed();
  for (const page of pages) {
    const result = validateTree(page.tree);
    if (!result.ok)
      throw new Error(
        `Seed page ${page.siteSlug}${page.path} is invalid:\n${JSON.stringify(result.issues, null, 2)}`,
      );
  }
  for (const entry of entries) {
    const result = validateEntry(entry.collection as CollectionId, entry.data);
    if (!result.ok)
      throw new Error(
        `Seed entry ${entry.siteSlug}/${entry.collection}/${entry.slug} is invalid: ${JSON.stringify(result.errors)}`,
      );
  }
  await resetDatabase({ sites, pages, entries });
  console.log(
    `Seeded ${sites.length} sites, ${pages.length} pages and ${entries.length} entries.`,
  );
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDb);
