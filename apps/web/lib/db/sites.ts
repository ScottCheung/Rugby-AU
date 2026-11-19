import type { Site } from '../types';
import { getDb } from './client';
import { SITES, type SiteDocument } from './documents';

function toSite({ _id, ...site }: SiteDocument): Site {
  return { id: _id.toHexString(), ...site };
}

export async function listSites(): Promise<Site[]> {
  const db = await getDb();
  const sites = await db
    .collection<SiteDocument>(SITES)
    .find()
    .sort({ name: 1 })
    .toArray();
  return sites.map(toSite);
}

/** Uses the unique index on slug. */
export async function getSiteBySlug(slug: string): Promise<Site | null> {
  const db = await getDb();
  const site = await db.collection<SiteDocument>(SITES).findOne({ slug });
  return site ? toSite(site) : null;
}
