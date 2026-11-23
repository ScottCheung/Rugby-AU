import { describe, expect, it } from 'vitest';
import { siteMenu } from '../lib/render/pageData';
import type { Page, PageNav } from '../lib/types';

const page = (
  id: string,
  path: string,
  title: string,
  nav?: PageNav,
  published = true,
): Page => {
  const content = { title, components: [], ...(nav ? { nav } : {}) };
  return {
    id,
    siteSlug: 'demo',
    path,
    draft: content,
    published: published
      ? { ...content, version: 1, publishedAt: '2026-11-21T00:00:00.000Z' }
      : null,
    updatedAt: '2026-11-21T00:00:00.000Z',
  };
};

const pages = [
  page('news', '/news', 'News'),
  page('about', '/about', 'About the club'),
  page('home', '/', 'Welcome'),
  page('story', '/news/story', 'A story'),
  page('draft', '/draft', 'Not yet', undefined, false),
];

describe('siteMenu', () => {
  it('lists published top-level pages, home first and named Home', () => {
    expect(siteMenu(pages).map((item) => item.title)).toEqual([
      'Home',
      'About the club',
      'News',
    ]);
  });

  it('follows the site’s order, home always first', () => {
    expect(
      siteMenu(pages, ['news', 'home', 'about']).map((item) => item.path),
    ).toEqual(['/', '/news', '/about']);
  });

  it('uses menu labels and leaves out hidden pages', () => {
    const labelled = [
      page('home', '/', 'Welcome', { label: 'Start' }),
      page('about', '/about', 'About the club', { label: 'About' }),
      page('news', '/news', 'News', { hidden: true }),
    ];
    expect(siteMenu(labelled).map((item) => item.title)).toEqual([
      'Start',
      'About',
    ]);
  });
});
