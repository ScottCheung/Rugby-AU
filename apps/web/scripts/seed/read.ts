import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { SeedEntry, SeedPage } from '../../lib/db/reset';
import { sites } from './sites';

/**
 * Each site's content is a JSON file in data/: its pages (portable page
 * documents, exactly as stored) and its entries (news articles and
 * players).
 */
type SiteFile = {
  pages: Omit<SeedPage, 'siteSlug'>[];
  entries: Omit<SeedEntry, 'siteSlug'>[];
};

export function readSeed(): { pages: SeedPage[]; entries: SeedEntry[] } {
  const pages: SeedPage[] = [];
  const entries: SeedEntry[] = [];
  for (const site of sites) {
    const file = path.join(__dirname, 'data', `${site.slug}.json`);
    const data = JSON.parse(readFileSync(file, 'utf8')) as SiteFile;
    pages.push(...data.pages.map((page) => ({ siteSlug: site.slug, ...page })));
    entries.push(
      ...data.entries.map((entry) => ({ siteSlug: site.slug, ...entry })),
    );
  }
  return { pages, entries };
}
