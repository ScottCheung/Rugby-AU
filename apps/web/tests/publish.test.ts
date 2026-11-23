import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createNode } from '../lib/components/createNode';
import { closeDb, getDb } from '../lib/db/client';
import { ensureIndexes } from '../lib/db/indexes';
import {
  createPage,
  discardDraft,
  getPageById,
  getPublishedPage,
  listPublishedPages,
  listVersions,
  publishPage,
  restoreVersion,
  saveDraft,
} from '../lib/db/pages';
import type { PageContent } from '../lib/types';
import { KEEP_LATEST_VERSIONS } from '../lib/versions/retention';

/**
 * The publish flow against a real MongoDB (docker compose up -d), in its
 * own throwaway database. Skipped, with a note, when MongoDB is not running.
 */
const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const TEST_DB = 'rugby_site_manager_test';

async function mongoIsUp() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 1000 });
  try {
    await client.connect();
    return true;
  } catch {
    console.warn('MongoDB is not running: skipping the publish flow tests.');
    return false;
  } finally {
    await client.close();
  }
}

const available = await mongoIsUp();

const content = (title: string, heading = title): PageContent => {
  const section = createNode('section');
  return {
    title,
    components: [{ ...section, props: { ...section.props, heading } }],
  };
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

describe.skipIf(!available)('draft and publish', () => {
  let pageId: string;

  beforeAll(async () => {
    process.env.MONGODB_DB = TEST_DB;
    await (await getDb()).dropDatabase();
    await ensureIndexes(await getDb());
  });

  afterAll(async () => {
    await (await getDb()).dropDatabase();
    await closeDb();
  });

  beforeEach(async () => {
    const created = await createPage({
      siteSlug: 'test-site',
      path: `/page-${crypto.randomUUID().slice(0, 8)}`,
      title: 'New page',
    });
    if (!created.ok) throw new Error('could not create the test page');
    pageId = created.page.id;
  });

  const path = async () => (await getPageById(pageId))!.path;
  const save = async (draft: PageContent) =>
    saveDraft(pageId, { path: await path(), draft });

  it('a page that was never published is not public', async () => {
    await save(content('Only a draft'));
    expect(await getPublishedPage('test-site', await path())).toBeNull();
    const listed = await listPublishedPages('test-site');
    expect(listed.some((page) => page.id === pageId)).toBe(false);
  });

  it('publish copies the draft, numbers the version and records it', async () => {
    await save(content('First'));
    const first = await publishPage(pageId);
    expect(first.ok && first.page.published?.version).toBe(1);
    expect(first.ok && first.page.published?.title).toBe('First');

    await save(content('Second'));
    const second = await publishPage(pageId);
    expect(second.ok && second.page.published?.version).toBe(2);

    const versions = await listVersions(pageId);
    expect(versions.map((entry) => [entry.version, entry.title])).toEqual([
      [2, 'Second'],
      [1, 'First'],
    ]);
  });

  it('the public lookup never sees draft content', async () => {
    await save(content('Live title', 'Live heading'));
    await publishPage(pageId);
    await save(content('Draft title', 'Draft heading'));

    const live = await getPublishedPage('test-site', await path());
    expect(live?.content.title).toBe('Live title');
    expect(JSON.stringify(live)).not.toContain('Draft');
  });

  it('refuses to publish a draft that fails the schemas', async () => {
    const broken = content('Broken');
    broken.components[0].props = { columns: 'not a layout' };
    // Write it directly: Save draft in the app validates too.
    await (
      await getDb()
    )
      .collection('pages')
      .updateOne({ path: await path() }, { $set: { draft: broken } });
    const result = await publishPage(pageId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('invalid');
    expect(await listVersions(pageId)).toEqual([]);
  });

  it('discard puts the draft back to what is published', async () => {
    await save(content('Published'));
    await publishPage(pageId);
    await save(content('Changed my mind'));

    const page = await discardDraft(pageId);
    expect(page?.draft.title).toBe('Published');
    expect(page?.published?.version).toBe(1);
  });

  it('restore copies an old version into the draft only', async () => {
    await save(content('Version one'));
    await publishPage(pageId);
    await save(content('Version two'));
    await publishPage(pageId);

    const page = await restoreVersion(pageId, 1);
    expect(page?.draft.title).toBe('Version one');
    // Visitors still see version 2 until the editor publishes again.
    expect(page?.published?.title).toBe('Version two');
    const republished = await publishPage(pageId);
    expect(republished.ok && republished.page.published?.version).toBe(3);
    expect(republished.ok && republished.page.published?.title).toBe(
      'Version one',
    );
  });

  it('keeps the latest 10 versions plus every version from the last 30 days', async () => {
    // 12 publishes long ago, a month apart. Retention runs at each publish,
    // so every earlier version is over 30 days old by then: the newest 10 stay.
    for (let month = 0; month < 12; month++) {
      await save(content(`Old ${month + 1}`));
      await publishPage(pageId, daysAgo(400 - month * 31));
    }
    let kept = (await listVersions(pageId)).map((entry) => entry.version);
    expect(kept).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    expect(kept).toHaveLength(KEEP_LATEST_VERSIONS);

    // 12 more today: all recent ones stay, even though that is more than
    // 10, and the old ones beyond the latest 10 go.
    for (let count = 0; count < 12; count++) {
      await save(content(`New ${count + 1}`));
      await publishPage(pageId);
    }
    kept = (await listVersions(pageId)).map((entry) => entry.version);
    expect(kept).toEqual([24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13]);
  });
});
