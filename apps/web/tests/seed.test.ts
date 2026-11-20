import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateTree } from '../lib/components/validateTree';
import { summarizeArticles } from '../lib/news';
import type { ComponentNode } from '../lib/types';
import { pages } from '../scripts/seed/pages';
import { sites } from '../scripts/seed/sites';
import { squads } from '../scripts/seed/squads';

/** Every site-relative href in a tree (card links and slide buttons). */
function hrefs(nodes: ComponentNode[]): string[] {
  return nodes.flatMap((node) => {
    const found = JSON.stringify(node.props).match(/"href":"([^"]+)"/g) ?? [];
    return [
      ...found.map((match) => match.slice(8, -1)),
      ...hrefs(node.children ?? []),
    ];
  });
}

describe('seed data', () => {
  it('has unique site slugs and a home page for every site', () => {
    const slugs = sites.map((site) => site.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs)
      expect(
        pages.some((page) => page.siteSlug === slug && page.path === '/'),
      ).toBe(true);
  });

  it('only has pages for known sites, with unique paths per site', () => {
    const keys = pages.map((page) => `${page.siteSlug}${page.path}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const page of pages)
      expect(sites.some((site) => site.slug === page.siteSlug)).toBe(true);
  });

  it('every page passes the same validation as an editor save', () => {
    for (const page of pages)
      expect(validateTree(page.tree).ok, `${page.siteSlug}${page.path}`).toBe(
        true,
      );
  });

  it('has no broken internal links', () => {
    for (const page of pages) {
      for (const href of hrefs(page.tree).filter((value) =>
        value.startsWith('/'),
      )) {
        const target = pages.find(
          (candidate) =>
            candidate.siteSlug === page.siteSlug && candidate.path === href,
        );
        expect(
          target,
          `${page.siteSlug}${page.path} links to missing ${href}`,
        ).toBeDefined();
      }
    }
  });

  it('gives every site several pages, each one reachable', () => {
    for (const site of sites) {
      const own = pages.filter((page) => page.siteSlug === site.slug);
      expect(own.length, site.slug).toBeGreaterThanOrEqual(4);
      // Top-level pages are in the site menu; articles are reached through
      // Latest news. Anything else needs a link from another page.
      const articles = summarizeArticles(own).map((article) => article.path);
      for (const target of own.filter((page) => page.path !== '/')) {
        const linked =
          target.path.split('/').length === 2 ||
          articles.includes(target.path) ||
          own.some(
            (page) => page !== target && hrefs(page.tree).includes(target.path),
          );
        expect(linked, `${site.slug}${target.path} is never linked`).toBe(true);
      }
    }
  });

  it('gives every site a news page and valid articles under /news/', () => {
    for (const site of sites) {
      const own = pages.filter((page) => page.siteSlug === site.slug);
      expect(
        own.some((page) => page.path === '/news'),
        site.slug,
      ).toBe(true);
      const underNews = own.filter((page) => page.path.startsWith('/news/'));
      expect(underNews.length, site.slug).toBeGreaterThanOrEqual(3);
      expect(summarizeArticles(underNews)).toHaveLength(underNews.length);
    }
  });
});

describe('squads', () => {
  const teamSites = [
    'wallabies',
    'wallaroos',
    'australia-sevens',
    'brumbies',
    'reds',
    'waratahs',
    'western-force',
  ];

  it('gives every team site a Squad page with every player in its source list', () => {
    for (const slug of teamSites) {
      const squad = squads[slug];
      expect(squad, slug).toBeDefined();
      const squadPage = pages.find(
        (page) => page.siteSlug === slug && page.path === '/squad',
      );
      expect(squadPage, slug).toBeDefined();
      const shown = JSON.stringify(squadPage!.tree).match(/"name":"/g) ?? [];
      const listed = squad.groups.reduce(
        (sum, group) => sum + group.players.length,
        0,
      );
      expect(shown.length, slug).toBe(listed);
    }
  });

  it('records where each squad comes from', () => {
    for (const squad of Object.values(squads)) {
      expect(squad.source.url).toMatch(/^https:\/\//);
      expect(squad.source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('only uses player photos that exist, each with its matching backdrop', () => {
    const used = new Set(
      pages.flatMap(
        (page) =>
          JSON.stringify(page.tree).match(
            /\/players\/[a-z-]+\/[a-z0-9-]+\.webp/g,
          ) ?? [],
      ),
    );
    expect(used.size).toBeGreaterThan(200);
    for (const path of used) {
      expect(existsSync(join(__dirname, '../public', path)), path).toBe(true);
      const pair = path.endsWith('-bg.webp')
        ? path.replace('-bg.webp', '.webp')
        : path.replace('.webp', '-bg.webp');
      expect(used.has(pair), pair).toBe(true);
    }
  });

  it('lists nobody twice within one squad', () => {
    for (const [slug, squad] of Object.entries(squads)) {
      const all = squad.groups.flatMap((group) =>
        group.players.map((player) => player.name),
      );
      expect(new Set(all).size, slug).toBe(all.length);
    }
  });
});
