import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateEntry, type CollectionId } from '../lib/collections';
import { allNodes } from '../lib/components/tree';
import { validateTree } from '../lib/components/validateTree';
import type { ComponentNode } from '../lib/types';
import { readSeed } from '../scripts/seed/read';
import { sites } from '../scripts/seed/sites';

const { pages, entries } = readSeed();

/** Every href in a tree or an entry (card links, buttons). */
const hrefs = (value: unknown): string[] =>
  (JSON.stringify(value).match(/"href":"([^"]+)"/g) ?? []).map((match) =>
    match.slice(8, -1),
  );

const articlesOf = (slug: string) =>
  entries.filter(
    (entry) => entry.siteSlug === slug && entry.collection === 'news',
  );

describe('seed data', () => {
  it('has unique site slugs and a home page for every site', () => {
    const slugs = sites.map((site) => site.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs)
      expect(
        pages.some((page) => page.siteSlug === slug && page.path === '/'),
        slug,
      ).toBe(true);
  });

  it('only has pages for known sites, with unique paths per site', () => {
    const keys = pages.map((page) => `${page.siteSlug}${page.path}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const page of pages)
      expect(sites.some((site) => site.slug === page.siteSlug)).toBe(true);
  });

  it('every page passes the same validation as an editor save', () => {
    for (const page of pages) {
      const result = validateTree(page.tree);
      expect(
        result.ok ? [] : result.issues,
        `${page.siteSlug}${page.path}`,
      ).toEqual([]);
    }
  });

  it('every entry passes its collection’s schema', () => {
    for (const entry of entries)
      expect(
        validateEntry(entry.collection as CollectionId, entry.data).ok,
        `${entry.siteSlug}/${entry.collection}/${entry.slug}`,
      ).toBe(true);
  });

  it('has no broken internal links', () => {
    for (const page of pages)
      for (const href of hrefs(page.tree).filter((value) =>
        value.startsWith('/'),
      )) {
        const article = /^\/news\/([^/]+)$/.exec(href)?.[1];
        const found = article
          ? articlesOf(page.siteSlug).some((entry) => entry.slug === article)
          : pages.some(
              (candidate) =>
                candidate.siteSlug === page.siteSlug && candidate.path === href,
            );
        expect(found, `${page.siteSlug}${page.path} links to ${href}`).toBe(
          true,
        );
      }
  });

  it('gives every site several pages, each one reachable', () => {
    for (const site of sites) {
      const own = pages.filter(
        (page) => page.siteSlug === site.slug && !page.template,
      );
      expect(own.length, site.slug).toBeGreaterThanOrEqual(4);
      // Top-level pages are in the menu; anything else needs a link.
      for (const target of own.filter((page) => page.path !== '/')) {
        const linked =
          target.path.split('/').length === 2 ||
          own.some(
            (page) => page !== target && hrefs(page.tree).includes(target.path),
          );
        expect(linked, `${site.slug}${target.path} is never linked`).toBe(true);
      }
    }
  });

  it('gives every site a news page, an article template and articles', () => {
    for (const site of sites) {
      const own = pages.filter((page) => page.siteSlug === site.slug);
      expect(
        own.some((page) => page.path === '/news'),
        site.slug,
      ).toBe(true);
      const template = own.find((page) => page.template === 'news');
      expect(template, site.slug).toBeDefined();
      // The template is made of ordinary blocks bound to the article.
      expect(
        allNodes(template!.tree).some(
          (node) =>
            (node.props.content as { from?: string } | undefined)?.from ===
            'entry',
        ),
      ).toBe(true);
      expect(articlesOf(site.slug).length, site.slug).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('players', () => {
  const teamSites = [
    'wallabies',
    'wallaroos',
    'australia-sevens',
    'brumbies',
    'reds',
    'waratahs',
    'western-force',
  ];
  const players = entries.filter((entry) => entry.collection === 'players');

  it('gives every team site players and a Squad page that shows them', () => {
    for (const slug of teamSites) {
      expect(
        players.filter((entry) => entry.siteSlug === slug).length,
        slug,
      ).toBeGreaterThan(10);
      const squad = pages.find(
        (page) => page.siteSlug === slug && page.path === '/squad',
      );
      expect(squad, slug).toBeDefined();
      expect(
        allNodes(squad!.tree as ComponentNode[]).some(
          (node) =>
            (node.props.content as { from?: string } | undefined)?.from ===
            'players',
        ),
        slug,
      ).toBe(true);
    }
  });

  it('lists nobody twice on one site', () => {
    for (const slug of teamSites) {
      const names = players
        .filter((entry) => entry.siteSlug === slug)
        .map((entry) => String(entry.data.name));
      expect(new Set(names).size, slug).toBe(names.length);
    }
  });

  it('only uses player photos that exist, each with its matching backdrop', () => {
    const used = new Set(
      JSON.stringify(players).match(/\/players\/[a-z-]+\/[a-z0-9-]+\.webp/g) ??
        [],
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
});
