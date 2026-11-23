import type { Entry } from './index';
import { articleSchema } from './article';
import { playerSchema, type Player } from './index';

/** What a news card needs: an article, as listed. */
export type ArticleSummary = {
  /** The entry's slug (a page id for articles still stored as pages). */
  id: string;
  path: string;
  category: string;
  date: string;
  headline: string;
  standfirst: string;
  image: { url: string; alt: string };
};

/** A player as listed (Players column). */
export type PlayerSummary = Player & { id: string };

/** The published news entries as cards, newest first. Invalid ones are left out. */
export function articlesFromEntries(entries: Entry[]): ArticleSummary[] {
  const found: ArticleSummary[] = [];
  for (const entry of entries) {
    if (entry.collection !== 'news') continue;
    const parsed = articleSchema.safeParse(entry.data);
    if (!parsed.success) continue;
    const { category, date, headline, standfirst, image } = parsed.data;
    found.push({
      id: entry.slug,
      path: `/news/${entry.slug}`,
      category,
      date,
      headline,
      standfirst,
      image,
    });
  }
  return found.sort(
    (a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path),
  );
}

/** Players in the order they were added. Invalid ones are left out. */
export function playersFromEntries(entries: Entry[]): PlayerSummary[] {
  return entries.flatMap((entry) => {
    if (entry.collection !== 'players') return [];
    const parsed = playerSchema.safeParse(entry.data);
    return parsed.success ? [{ ...parsed.data, id: entry.slug }] : [];
  });
}
