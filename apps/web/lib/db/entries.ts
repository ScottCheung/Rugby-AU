import { MongoServerError, ObjectId } from 'mongodb';
import type { CollectionId, Entry } from '../collections';
import { getDb } from './client';
import { ENTRIES, type EntryDocument } from './documents';

function toEntry({ _id, updatedAt, ...entry }: EntryDocument): Entry {
  return {
    id: _id.toHexString(),
    ...entry,
    updatedAt: updatedAt.toISOString(),
  };
}

async function entries() {
  return (await getDb()).collection<EntryDocument>(ENTRIES);
}

/** A site's entries of one collection (or all), newest saved first. */
export async function listEntries(
  siteSlug: string,
  options: { collection?: CollectionId; publishedOnly?: boolean } = {},
): Promise<Entry[]> {
  const found = await (
    await entries()
  )
    .find({
      siteSlug,
      ...(options.collection ? { collection: options.collection } : {}),
      ...(options.publishedOnly ? { status: 'published' as const } : {}),
    })
    .sort({ updatedAt: -1, _id: 1 })
    .toArray();
  return found.map(toEntry);
}

export async function getEntry(
  siteSlug: string,
  collection: CollectionId,
  slug: string,
): Promise<Entry | null> {
  const found = await (await entries()).findOne({ siteSlug, collection, slug });
  return found ? toEntry(found) : null;
}

export async function createEntry(input: {
  siteSlug: string;
  collection: CollectionId;
  slug: string;
  data: Record<string, unknown>;
  status?: Entry['status'];
}): Promise<{ ok: true; entry: Entry } | { ok: false; reason: 'duplicate' }> {
  const document: EntryDocument = {
    _id: new ObjectId(),
    siteSlug: input.siteSlug,
    collection: input.collection,
    slug: input.slug,
    data: input.data,
    status: input.status ?? 'draft',
    updatedAt: new Date(),
  };
  try {
    await (await entries()).insertOne(document);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000)
      return { ok: false, reason: 'duplicate' };
    throw error;
  }
  return { ok: true, entry: toEntry(document) };
}

export async function updateEntry(
  siteSlug: string,
  collection: CollectionId,
  slug: string,
  changes: { data?: Record<string, unknown>; status?: Entry['status'] },
): Promise<Entry | null> {
  const updated = await (
    await entries()
  ).findOneAndUpdate(
    { siteSlug, collection, slug },
    { $set: { ...changes, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return updated ? toEntry(updated) : null;
}

export async function deleteEntry(
  siteSlug: string,
  collection: CollectionId,
  slug: string,
): Promise<boolean> {
  const result = await (
    await entries()
  ).deleteOne({ siteSlug, collection, slug });
  return result.deletedCount === 1;
}
