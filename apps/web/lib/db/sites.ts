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

/**
 * Write a site's editable fields (see lib/site/settings.ts). Optional ones
 * that are absent are removed, so clearing the logo really clears it.
 */
export async function updateSite(
  slug: string,
  site: Pick<
    Site,
    | 'name'
    | 'tagline'
    | 'logoUrl'
    | 'faviconUrl'
    | 'theme'
    | 'menuOrder'
    | 'headerButton'
    | 'footerLinks'
  >,
): Promise<Site | null> {
  const db = await getDb();
  const optional = [
    'logoUrl',
    'faviconUrl',
    'menuOrder',
    'headerButton',
    'footerLinks',
  ] as const;
  const set: Partial<SiteDocument> = {
    name: site.name,
    tagline: site.tagline,
    theme: site.theme,
  };
  const unset: Record<string, ''> = {};
  for (const key of optional) {
    if (site[key] === undefined) unset[key] = '';
    else Object.assign(set, { [key]: site[key] });
  }
  const updated = await db.collection<SiteDocument>(SITES).findOneAndUpdate(
    { slug },
    {
      $set: set,
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    { returnDocument: 'after' },
  );
  return updated ? toSite(updated) : null;
}
