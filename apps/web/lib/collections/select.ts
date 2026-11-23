import type { ArticleSummary, PlayerSummary } from './summaries';

/** The choices a collection column makes about which entries to show. */
export type EntryChoice = {
  /** Show exactly these entries (slugs), in this order. */
  picked?: string[];
  /** Entries (slugs) left out. They stay in the editor, ghosted. */
  hidden?: string[];
  limit?: number;
};

/**
 * Players for a Players column: a group, or hand-picked, minus hidden.
 * `editing` keeps the hidden ones, marked, so they can be shown again.
 */
export function selectPlayers(
  players: PlayerSummary[],
  options: EntryChoice & { group?: string; editing?: boolean },
): { player: PlayerSummary; hidden: boolean }[] {
  const hidden = new Set(options.hidden);
  const base = options.picked?.length
    ? options.picked.flatMap((id) => players.find((p) => p.id === id) ?? [])
    : players.filter((p) => !options.group || p.group === options.group);
  const marked = base.map((player) => ({
    player,
    hidden: hidden.has(player.id),
  }));
  const shown = options.editing ? marked : marked.filter((m) => !m.hidden);
  if (!options.limit) return shown;
  // Hidden ones do not count towards the limit.
  let visible = 0;
  return shown.filter((m) => {
    if (visible >= options.limit!) return false;
    if (!m.hidden) visible += 1;
    return true;
  });
}

// ------------------------------------------------------------------ news

type SelectOptions = {
  category?: string;
  limit: number;
  /** The page being rendered: "More news" never repeats it. */
  exclude?: string;
  /** Article ids this list leaves out (a block's `hidden`). */
  hidden?: string[];
  /** Show exactly these articles, in this order (ignores category and limit). */
  picked?: string[];
};

const inList = (article: ArticleSummary, options: SelectOptions) =>
  (!options.category || article.category === options.category) &&
  article.path !== options.exclude;

/**
 * A news block: optionally one category, never `exclude`, never a hidden
 * article, at most `limit`. Hidden articles do not count towards the
 * limit: the next article takes their place.
 */
export function selectArticles(
  articles: ArticleSummary[],
  options: SelectOptions,
): ArticleSummary[] {
  const hidden = new Set(options.hidden);
  if (options.picked?.length)
    return options.picked
      .flatMap((id) => articles.find((article) => article.id === id) ?? [])
      .filter((article) => !hidden.has(article.id));
  return articles
    .filter((article) => inList(article, options) && !hidden.has(article.id))
    .slice(0, options.limit);
}

/**
 * What the editor's preview draws: the same cards visitors see, plus the
 * hidden ones that fall among them, marked, so they can be shown again.
 */
export function selectArticlesForEditor(
  articles: ArticleSummary[],
  options: SelectOptions,
): { article: ArticleSummary; hidden: boolean }[] {
  const hidden = new Set(options.hidden);
  if (options.picked?.length)
    return options.picked.flatMap((id) => {
      const article = articles.find((entry) => entry.id === id);
      return article ? [{ article, hidden: hidden.has(id) }] : [];
    });
  const drawn: { article: ArticleSummary; hidden: boolean }[] = [];
  let visible = 0;
  for (const article of articles) {
    if (visible >= options.limit) break;
    if (!inList(article, options)) continue;
    const isHidden = hidden.has(article.id);
    drawn.push({ article, hidden: isHidden });
    if (!isHidden) visible += 1;
  }
  return drawn;
}

/** "2026-11-20" -> "20 November 2026". UTC, so server and browser agree. */
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
