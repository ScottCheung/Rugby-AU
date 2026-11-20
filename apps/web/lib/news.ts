import { articleSchema } from './components/article';
import type { ComponentNode } from './types';

/** What a news card needs to know about an article page. */
export type ArticleSummary = {
  path: string;
  category: string;
  date: string;
  headline: string;
  standfirst: string;
  image: { url: string; alt: string };
};

/**
 * Data that data-driven components read while a page renders: the site's
 * articles, and the path of the page being rendered.
 */
export type SiteData = { articles: ArticleSummary[]; pagePath: string };

function findArticle(nodes: ComponentNode[]): ComponentNode | undefined {
  for (const node of nodes) {
    if (node.type === 'article') return node;
    const inner = findArticle(node.children ?? []);
    if (inner) return inner;
  }
  return undefined;
}

/**
 * The site's articles, newest first. An article is any page with an Article
 * block; its props become the card. Pages whose Article no longer validates
 * are left out rather than shown broken.
 */
export function summarizeArticles(
  pages: { path: string; tree: ComponentNode[] }[],
): ArticleSummary[] {
  const found: ArticleSummary[] = [];
  for (const page of pages) {
    const node = findArticle(page.tree);
    const parsed = node && articleSchema.safeParse(node.props);
    if (!parsed?.success) continue;
    const { category, date, headline, standfirst, image } = parsed.data;
    found.push({
      path: page.path,
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

/** Latest news: optionally one category, at most `limit`, never `exclude`. */
export function selectArticles(
  articles: ArticleSummary[],
  options: { category?: string; limit: number; exclude?: string },
): ArticleSummary[] {
  return articles
    .filter(
      (article) =>
        (!options.category || article.category === options.category) &&
        article.path !== options.exclude,
    )
    .slice(0, options.limit);
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
