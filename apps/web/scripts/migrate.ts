import type { ObjectId } from 'mongodb';
import { validateTree } from '../lib/components/validateTree';
import { closeDb, getDb } from '../lib/db/client';
import {
  ENTRIES,
  PAGE_VERSIONS,
  PAGES,
  type EntryDocument,
  type PageDocument,
  type PageVersionDocument,
} from '../lib/db/documents';
import { blocksFromColumns } from '../lib/migrate/blocksFromColumns';
import { sectionBackgrounds } from '../lib/migrate/sectionBackgrounds';
import { splitLayouts } from '../lib/migrate/splitLayouts';
import { articleWithStory, storyBlocks } from '../lib/migrate/storyBlocks';
import type { ComponentNode } from '../lib/types';

/** Every upgrade, oldest first; each is pure and idempotent. */
const upgrade = (tree: ComponentNode[]) =>
  sectionBackgrounds(storyBlocks(splitLayouts(blocksFromColumns(tree))));

/**
 * Upgrades stored pages to the current page format: Sections of blocks
 * instead of Sections of columns (lib/migrate/blocksFromColumns.ts), and
 * block layouts as one of six arrangements (splitLayouts.ts), Section
 * backgrounds by their current names (sectionBackgrounds.ts). Every
 * copy is upgraded (draft, published and each past version), so restoring
 * an old version gives a page in the current format too. Article bodies
 * stored as one text field are split into pieces (storyBlocks.ts), and
 * the template's story block reads them as a Story block. Pages already
 * upgraded are left alone: safe to run again.
 *
 * Each upgraded draft is checked against the component library before it
 * is stored; a page that would not validate is reported and left as it is.
 */
async function migrate() {
  const db = await getDb();
  const pages = db.collection<PageDocument>(PAGES);
  const versions = db.collection<PageVersionDocument>(PAGE_VERSIONS);
  let changed = 0;
  const failed: string[] = [];

  for (const page of await pages.find().toArray()) {
    const draft = upgrade(page.draft.components);
    const published = page.published && upgrade(page.published.components);
    if (
      draft === page.draft.components &&
      published === page.published?.components
    )
      continue;
    const checked = validateTree(draft);
    if (!checked.ok) {
      failed.push(
        `${page.siteSlug}${page.path}: ${checked.issues
          .map((issue) => issue.message)
          .join('; ')}`,
      );
      continue;
    }
    await pages.updateOne(
      { _id: page._id },
      {
        $set: {
          'draft.components': draft,
          ...(published ? { 'published.components': published } : {}),
        },
      },
    );
    changed += 1;
  }

  let versionCount = 0;
  for (const version of await versions.find().toArray()) {
    const components = upgrade(version.components as ComponentNode[]);
    if (components === version.components) continue;
    await versions.updateOne(
      { _id: version._id as ObjectId },
      { $set: { components } },
    );
    versionCount += 1;
  }

  let articleCount = 0;
  const entries = db.collection<EntryDocument>(ENTRIES);
  for (const entry of await entries.find({ collection: 'news' }).toArray()) {
    const data = articleWithStory(entry.data);
    if (data === entry.data) continue;
    await entries.updateOne({ _id: entry._id }, { $set: { data } });
    articleCount += 1;
  }

  console.log(
    `Upgraded ${changed} page(s), ${versionCount} past version(s) and ${articleCount} article(s) to the current format.`,
  );
  if (failed.length > 0) {
    console.error(`Left ${failed.length} page(s) as they were:`);
    for (const line of failed) console.error(`  ${line}`);
    process.exitCode = 1;
  }
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDb);
