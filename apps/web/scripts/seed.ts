import { validateTree } from '../lib/components/validateTree';
import { closeDb } from '../lib/db/client';
import { resetDatabase } from '../lib/db/reset';
import { pages, sites } from './seedData';

/** Idempotent: drops and recreates both collections every time it runs. */
async function seed() {
  // Seed pages go through the same validation as editor saves.
  for (const page of pages) {
    const result = validateTree(page.tree);
    if (!result.ok) {
      throw new Error(
        `Seed page ${page.siteSlug}${page.path} is invalid:\n${JSON.stringify(result.issues, null, 2)}`,
      );
    }
  }
  await resetDatabase({ sites, pages });
  console.log(`Seeded ${sites.length} sites and ${pages.length} pages.`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDb);
