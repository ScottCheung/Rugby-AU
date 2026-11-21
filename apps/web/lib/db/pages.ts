import { MongoServerError, ObjectId } from 'mongodb';
import { validateTree, type TreeIssue } from '../components/validateTree';
import type { Page, PageContent, PageVersion } from '../types';
import { versionsToDelete } from '../versions/retention';
import { getDb } from './client';
import {
  PAGE_VERSIONS,
  PAGES,
  type PageDocument,
  type PageVersionDocument,
  type PublishedDocument,
} from './documents';

function toPage({ _id, updatedAt, published, ...page }: PageDocument): Page {
  return {
    id: _id.toHexString(),
    ...page,
    published: published && {
      ...published,
      publishedAt: published.publishedAt.toISOString(),
    },
    updatedAt: updatedAt.toISOString(),
  };
}

function toVersion(document: PageVersionDocument): PageVersion {
  return {
    pageId: document.pageId.toHexString(),
    ...contentOf(document),
    version: document.version,
    publishedAt: document.publishedAt.toISOString(),
  };
}

/** Only the content fields: never copy ids or dates by accident. */
function contentOf({ title, description, components }: PageContent) {
  return {
    title,
    ...(description ? { description } : {}),
    components,
  };
}

async function pages() {
  return (await getDb()).collection<PageDocument>(PAGES);
}

async function versions() {
  return (await getDb()).collection<PageVersionDocument>(PAGE_VERSIONS);
}

const byId = (id: string) =>
  ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null;

// ------------------------------------------------------------------- read

/** Every page of a site, published or not: for the manager. */
export async function listPages(siteSlug: string): Promise<Page[]> {
  const found = await (
    await pages()
  )
    .find({ siteSlug })
    .sort({ path: 1 })
    .toArray();
  return found.map(toPage);
}

/** The pages visitors can see: for the public menu and Latest news. */
export async function listPublishedPages(siteSlug: string): Promise<Page[]> {
  const found = await (
    await pages()
  )
    .find({ siteSlug, published: { $ne: null } })
    .sort({ path: 1 })
    .toArray();
  return found.map(toPage);
}

/** Number of pages per site slug, for the manager's site list. */
export async function countPagesBySite(): Promise<Record<string, number>> {
  const rows = await (
    await pages()
  )
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$siteSlug', count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** Uses the unique { siteSlug, path } index. Draft and published both. */
export async function getPageByPath(
  siteSlug: string,
  path: string,
): Promise<Page | null> {
  const page = await (await pages()).findOne({ siteSlug, path });
  return page ? toPage(page) : null;
}

/**
 * The public renderer's lookup: a page that was never published does not
 * exist for visitors. Returns only the published content, so draft content
 * cannot reach the public route by mistake.
 */
export async function getPublishedPage(
  siteSlug: string,
  path: string,
): Promise<{ id: string; path: string; content: PageContent } | null> {
  const page = await (
    await pages()
  ).findOne(
    { siteSlug, path, published: { $ne: null } },
    { projection: { path: 1, published: 1 } },
  );
  if (!page?.published) return null;
  return {
    id: page._id.toHexString(),
    path: page.path,
    content: contentOf(page.published),
  };
}

export async function getPageById(id: string): Promise<Page | null> {
  const filter = byId(id);
  const page = filter && (await (await pages()).findOne(filter));
  return page ? toPage(page) : null;
}

// ------------------------------------------------------------ draft edits

export type CreatePageResult =
  { ok: true; page: Page } | { ok: false; reason: 'duplicate-path' };

/** A new page starts as an empty draft and is not public until published. */
export async function createPage(input: {
  siteSlug: string;
  path: string;
  title: string;
}): Promise<CreatePageResult> {
  const document: PageDocument = {
    _id: new ObjectId(),
    siteSlug: input.siteSlug,
    path: input.path,
    draft: { title: input.title, components: [] },
    published: null,
    updatedAt: new Date(),
  };
  try {
    await (await pages()).insertOne(document);
    return { ok: true, page: toPage(document) };
  } catch (error) {
    // 11000 = duplicate key: the site already has a page at this path.
    if (error instanceof MongoServerError && error.code === 11000)
      return { ok: false, reason: 'duplicate-path' };
    throw error;
  }
}

export type SaveDraftResult =
  | { ok: true; page: Page }
  | { ok: false; reason: 'not-found' | 'duplicate-path' };

/**
 * Save draft: writes the draft (and the address) only. The published copy
 * is untouched, so visitors see no change until the next publish.
 */
export async function saveDraft(
  id: string,
  changes: { path: string; draft: PageContent },
): Promise<SaveDraftResult> {
  const filter = byId(id);
  if (!filter) return { ok: false, reason: 'not-found' };
  try {
    const updated = await (
      await pages()
    ).findOneAndUpdate(
      filter,
      {
        $set: {
          path: changes.path,
          draft: contentOf(changes.draft),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );
    return updated
      ? { ok: true, page: toPage(updated) }
      : { ok: false, reason: 'not-found' };
  } catch (error) {
    // The unique { siteSlug, path } index: another page already has this path.
    if (error instanceof MongoServerError && error.code === 11000)
      return { ok: false, reason: 'duplicate-path' };
    throw error;
  }
}

/** Replace the draft with some earlier content (discard, restore). */
async function replaceDraft(id: string, content: PageContent) {
  const filter = byId(id);
  if (!filter) return null;
  const updated = await (
    await pages()
  ).findOneAndUpdate(
    filter,
    { $set: { draft: contentOf(content), updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return updated ? toPage(updated) : null;
}

/** Discard changes: the draft goes back to what is published. */
export async function discardDraft(id: string): Promise<Page | null> {
  const page = await getPageById(id);
  if (!page?.published) return null;
  return replaceDraft(id, page.published);
}

// ---------------------------------------------------------------- publish

export type PublishResult =
  | { ok: true; page: Page }
  | { ok: false; reason: 'not-found' }
  | { ok: false; reason: 'invalid'; issues: TreeIssue[] };

/**
 * Publish: check the saved draft against the component schemas, copy it
 * into `published` with the next version number, record that version in
 * page_versions, then delete versions the retention rule no longer keeps.
 */
export async function publishPage(
  id: string,
  now = new Date(),
): Promise<PublishResult> {
  const page = await getPageById(id);
  if (!page) return { ok: false, reason: 'not-found' };
  const checked = validateTree(page.draft.components);
  if (!checked.ok)
    return { ok: false, reason: 'invalid', issues: checked.issues };

  const pageId = new ObjectId(id);
  const published: PublishedDocument = {
    ...contentOf({ ...page.draft, components: checked.tree }),
    version: (page.published?.version ?? 0) + 1,
    publishedAt: now,
  };
  // The version record first: its unique index rejects a second publish
  // racing for the same number before the page itself changes.
  await (
    await versions()
  ).insertOne({ _id: new ObjectId(), pageId, ...published });
  const updated = await (
    await pages()
  ).findOneAndUpdate(
    { _id: pageId },
    { $set: { published, draft: contentOf(published) } },
    { returnDocument: 'after' },
  );
  await applyRetention(pageId, now);
  return updated
    ? { ok: true, page: toPage(updated) }
    : { ok: false, reason: 'not-found' };
}

async function applyRetention(pageId: ObjectId, now: Date) {
  const collection = await versions();
  const all = await collection
    .find({ pageId }, { projection: { version: 1, publishedAt: 1 } })
    .toArray();
  const doomed = versionsToDelete(all, now);
  if (doomed.length > 0)
    await collection.deleteMany({ pageId, version: { $in: doomed } });
}

// --------------------------------------------------------------- versions

/** A page's kept versions, newest first, without their components. */
export async function listVersions(
  pageId: string,
): Promise<{ version: number; title: string; publishedAt: string }[]> {
  if (!ObjectId.isValid(pageId)) return [];
  const found = await (
    await versions()
  )
    .find(
      { pageId: new ObjectId(pageId) },
      { projection: { version: 1, title: 1, publishedAt: 1 } },
    )
    .sort({ version: -1 })
    .toArray();
  return found.map(({ version, title, publishedAt }) => ({
    version,
    title,
    publishedAt: publishedAt.toISOString(),
  }));
}

export async function getVersion(
  pageId: string,
  version: number,
): Promise<PageVersion | null> {
  if (!ObjectId.isValid(pageId)) return null;
  const found = await (
    await versions()
  ).findOne({ pageId: new ObjectId(pageId), version });
  return found ? toVersion(found) : null;
}

/** Restore to draft: copy an old version into the draft. Publish as usual. */
export async function restoreVersion(
  pageId: string,
  version: number,
): Promise<Page | null> {
  const found = await getVersion(pageId, version);
  return found ? replaceDraft(pageId, found) : null;
}

// ------------------------------------------------------------------ delete

/** Deletes a page and its history. */
export async function deletePage(id: string): Promise<boolean> {
  const filter = byId(id);
  if (!filter) return false;
  const result = await (await pages()).deleteOne(filter);
  await (await versions()).deleteMany({ pageId: filter._id });
  return result.deletedCount === 1;
}
