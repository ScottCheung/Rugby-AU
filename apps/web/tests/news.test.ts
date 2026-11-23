import { describe, expect, it } from 'vitest';
import { articleSchema, type Entry } from '../lib/collections';
import { articlesFromEntries } from '../lib/collections/summaries';
import { describeSchema } from '../lib/forms/describe';
import {
  formatDate,
  selectArticles,
  selectArticlesForEditor,
} from '../lib/collections/select';

const image = { url: 'https://example.com/a.jpg', alt: 'A photo' };
const article = (slug: string, date: string, category = 'News'): Entry => ({
  id: slug,
  siteSlug: 'demo',
  collection: 'news',
  slug,
  status: 'published',
  updatedAt: '2026-11-22T00:00:00.000Z',
  data: {
    category,
    date,
    headline: `Story ${slug}`,
    standfirst: 'In short.',
    image,
    body: [{ kind: 'paragraph', text: 'Text.' }],
  },
});

describe('articlesFromEntries', () => {
  it('turns news entries into cards, newest first, skipping invalid ones', () => {
    const articles = articlesFromEntries([
      article('older', '2026-10-01'),
      article('broken', 'not a date'),
      article('newer', '2026-11-01', 'History'),
    ]);
    expect(articles.map((one) => one.path)).toEqual([
      '/news/newer',
      '/news/older',
    ]);
    expect(articles[0]).toMatchObject({
      id: 'newer',
      category: 'History',
      headline: 'Story newer',
      standfirst: 'In short.',
      image,
    });
  });
});

describe('selectArticles', () => {
  const all = articlesFromEntries([
    article('a', '2026-11-03', 'History'),
    article('b', '2026-11-02'),
    article('c', '2026-11-01', 'History'),
  ]);
  const ids = (list: { id: string }[]) => list.map((one) => one.id);

  it('filters by category and limits the count', () => {
    expect(ids(selectArticles(all, { category: 'History', limit: 1 }))).toEqual(
      ['a'],
    );
  });

  it('leaves out the page it is shown on', () => {
    expect(ids(selectArticles(all, { limit: 3, exclude: '/news/a' }))).toEqual([
      'b',
      'c',
    ]);
  });

  it('leaves out hidden articles, and the next one takes their place', () => {
    expect(ids(selectArticles(all, { limit: 2, hidden: ['a'] }))).toEqual([
      'b',
      'c',
    ]);
  });

  it('shows hidden articles to the editor, marked, without counting them', () => {
    expect(
      selectArticlesForEditor(all, { limit: 2, hidden: ['a'] }).map(
        ({ article: one, hidden }) => [one.id, hidden],
      ),
    ).toEqual([
      ['a', true],
      ['b', false],
      ['c', false],
    ]);
  });
});

describe('formatDate', () => {
  it('writes dates the Australian way, the same on any time zone', () => {
    expect(formatDate('2026-11-20')).toBe('20 November 2026');
  });
});

describe('the article form', () => {
  it('shows the publish date as a date picker', () => {
    expect(
      describeSchema(articleSchema).find((field) => field.key === 'date'),
    ).toMatchObject({ kind: 'date', label: 'Published' });
  });
});
