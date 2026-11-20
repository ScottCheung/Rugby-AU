import { describe, expect, it } from 'vitest';
import { articleSchema } from '../lib/components/article';
import { describeSchema } from '../lib/forms/describe';
import { formatDate, selectArticles, summarizeArticles } from '../lib/news';
import type { ComponentNode } from '../lib/types';

const image = { url: 'https://example.com/a.jpg', alt: 'A photo' };
const articlePage = (
  path: string,
  date: string,
  category = 'News',
): { path: string; tree: ComponentNode[] } => ({
  path,
  tree: [
    {
      id: path,
      type: 'article',
      props: {
        category,
        date,
        headline: `Story ${path}`,
        standfirst: 'In short.',
        image,
        body: 'Text.',
      },
    },
  ],
});

describe('summarizeArticles', () => {
  it('turns pages with an Article into cards, newest first', () => {
    const articles = summarizeArticles([
      articlePage('/news/older', '2026-10-01'),
      { path: '/about', tree: [] },
      articlePage('/news/newer', '2026-11-01', 'History'),
    ]);
    expect(articles.map((article) => article.path)).toEqual([
      '/news/newer',
      '/news/older',
    ]);
    expect(articles[0]).toMatchObject({
      category: 'History',
      headline: 'Story /news/newer',
      standfirst: 'In short.',
      image,
    });
  });

  it('finds an Article inside a Section and skips invalid ones', () => {
    const nested = {
      path: '/news/nested',
      tree: [
        {
          id: 's',
          type: 'section',
          props: { layout: 'full', background: 'none' },
          children: articlePage('/x', '2026-09-01').tree,
        },
      ],
    };
    const broken = articlePage('/news/broken', 'not a date');
    expect(
      summarizeArticles([nested, broken]).map((article) => article.path),
    ).toEqual(['/news/nested']);
  });
});

describe('selectArticles', () => {
  const all = summarizeArticles([
    articlePage('/news/a', '2026-11-03', 'History'),
    articlePage('/news/b', '2026-11-02'),
    articlePage('/news/c', '2026-11-01', 'History'),
  ]);

  it('filters by category and limits the count', () => {
    expect(
      selectArticles(all, { category: 'History', limit: 1 }).map(
        (article) => article.path,
      ),
    ).toEqual(['/news/a']);
  });

  it('leaves out the page it is shown on', () => {
    expect(
      selectArticles(all, { limit: 3, exclude: '/news/a' }).map(
        (article) => article.path,
      ),
    ).toEqual(['/news/b', '/news/c']);
  });
});

describe('formatDate', () => {
  it('writes dates the Australian way, the same on any time zone', () => {
    expect(formatDate('2026-11-20')).toBe('20 November 2026');
  });
});

describe('the Article form', () => {
  it('shows the publish date as a date picker', () => {
    expect(
      describeSchema(articleSchema).find((field) => field.key === 'date'),
    ).toMatchObject({ kind: 'date', label: 'Published' });
  });
});
