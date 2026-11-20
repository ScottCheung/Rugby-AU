import { describe, expect, it } from 'vitest';
import { validateTree } from '../lib/components/validateTree';
import type { ComponentNode } from '../lib/types';
import { pages } from '../scripts/seed/pages';
import { sites } from '../scripts/seed/sites';

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
});
