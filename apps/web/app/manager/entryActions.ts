'use server';

import {
  collections,
  isCollection,
  slugify,
  validateEntry,
  type Entry,
} from '@/lib/collections';
import {
  createEntry,
  deleteEntry,
  getEntry,
  updateEntry,
} from '@/lib/db/entries';
import { getSiteBySlug } from '@/lib/db/sites';

// ---------------------------------------------------------------- create

/** A new entry, filled with its collection's starting data, as a draft. */
async function createBlank(
  siteSlug: string,
  collection: string,
): Promise<Entry | { error: string }> {
  if (!isCollection(collection) || !(await getSiteBySlug(siteSlug)))
    return { error: 'This site or collection no longer exists.' };
  const definition = collections[collection];
  const data = definition.blank();
  const base = slugify(definition.titleOf(data));
  for (let n = 1; n < 100; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const result = await createEntry({ siteSlug, collection, slug, data });
    if (result.ok) return result.entry;
  }
  return { error: 'Could not find a free address for the new entry.' };
}

/** A new entry for the editor's panel, which opens it in place. */
export async function createEntryInPlaceAction(
  siteSlug: string,
  collection: string,
): Promise<Entry | { error: string }> {
  return createBlank(siteSlug, collection);
}

/** One entry with all its fields, for the editor's panel. */
export async function getEntryAction(
  siteSlug: string,
  collection: string,
  slug: string,
): Promise<Entry | null> {
  if (!isCollection(collection)) return null;
  return getEntry(siteSlug, collection, slug);
}

// ------------------------------------------------------------------ save

export type SaveEntryResult =
  | { ok: true; entry: Entry }
  | { ok: false; message: string; errors: Record<string, string> };

/**
 * Save an entry. Validated with its collection's schema, whatever the
 * form allowed. It is live as soon as it is saved while published: an
 * entry has no separate draft, so the form says so.
 */
export async function saveEntryAction(
  siteSlug: string,
  collection: string,
  slug: string,
  data: unknown,
): Promise<SaveEntryResult> {
  if (!isCollection(collection))
    return { ok: false, message: 'Unknown collection.', errors: {} };
  const checked = validateEntry(collection, data);
  if (!checked.ok)
    return {
      ok: false,
      message: `Not saved: ${Object.keys(checked.errors).length} field(s) need attention.`,
      errors: checked.errors,
    };
  const entry = await updateEntry(siteSlug, collection, slug, {
    data: checked.data,
  });
  return entry
    ? { ok: true, entry }
    : { ok: false, message: 'This entry no longer exists.', errors: {} };
}

/** Publish or unpublish: visitors see only published entries. */
export async function setEntryStatusAction(
  siteSlug: string,
  collection: string,
  slug: string,
  status: Entry['status'],
): Promise<Entry | null> {
  if (!isCollection(collection)) return null;
  const existing = await getEntry(siteSlug, collection, slug);
  // Never publish something that would not pass its own schema.
  if (status === 'published' && existing) {
    const checked = validateEntry(collection, existing.data);
    if (!checked.ok) return null;
  }
  return updateEntry(siteSlug, collection, slug, { status });
}

/** Delete, staying where you are (the editor's panel). */
export async function deleteEntryInPlaceAction(
  siteSlug: string,
  collection: string,
  slug: string,
): Promise<boolean> {
  if (!isCollection(collection)) return false;
  await deleteEntry(siteSlug, collection, slug);
  return true;
}
