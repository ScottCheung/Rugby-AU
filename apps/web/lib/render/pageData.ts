import { allNodes } from '../components/tree';
import { cardColors } from '../imageColor';
import type { Entry } from '../collections';
import type { BlockProps } from '../components/blocks/defineBlock';
import { blockItems, tintSource } from '../components/blocks/resolve';
import { sourceIds } from '../components/blocks/sources';
import { getBlock } from '../components/registry';
import { sourceLoaders } from './sourceData';
import type { SiteData } from '../components/blocks/siteData';
import type { ComponentNode, MenuItem, Page } from '../types';

/**
 * What the public site shows of its other pages: published ones only, with
 * their published content. Used by the public route and the preview alike,
 * so the preview's menu and news match what visitors will see.
 */
function publishedOnly(pages: Page[]) {
  return pages.flatMap((page) =>
    page.published ? [{ ...page, content: page.published }] : [],
  );
}

/**
 * The site menu: its published top-level pages, except those hidden from
 * it, each under its menu label (else its title; "Home" for /). Home comes
 * first, then the site's chosen order (`menuOrder`, page ids), then any
 * page not in that order by path.
 */
export function siteMenu(
  sitePages: Page[],
  menuOrder: string[] = [],
): MenuItem[] {
  const rank = (page: { id: string; path: string }) => {
    if (page.path === '/') return -1;
    const at = menuOrder.indexOf(page.id);
    return at === -1 ? menuOrder.length : at;
  };
  return publishedOnly(sitePages)
    .filter(
      (page) => page.path.split('/').length === 2 && !page.content.nav?.hidden,
    )
    .sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))
    .map(({ id, path, content }) => ({
      id,
      path,
      title: content.nav?.label || (path === '/' ? 'Home' : content.title),
    }));
}

/**
 * What blocks fed by the site's data need to render a page, worked out on
 * the server before it renders: each data source loads its own records
 * (lib/render/sourceData.ts), then the colours of the photos the page's
 * items will show are picked (person cards arrive in their colour).
 *
 * `everything` is for the editor: a block can be switched to any team or
 * group, so it gets every record up front. The block filters itself, so
 * the result looks the same.
 */
export async function pageData({
  entries,
  path,
  components,
  entry,
  everything = false,
}: {
  /** The site's published entries (news, players). */
  entries: Entry[];
  path: string;
  components: ComponentNode[];
  /** On an entry's own page: the entry the template shows. */
  entry?: Entry;
  everything?: boolean;
}): Promise<SiteData> {
  const now = new Date();
  const loaded = await Promise.all(
    sourceIds.map((id) =>
      sourceLoaders[id]({ tree: components, entries, now, everything }),
    ),
  );
  const data: SiteData = {
    articles: [],
    players: [],
    fixtures: [],
    ...Object.assign({}, ...loaded),
    ...(entry ? { entry } : {}),
    pagePath: path,
    colors: {},
    now: now.toISOString(),
  };
  return { ...data, colors: await cardColors(backgrounds(components, data)) };
}

/** The background photos of every item the page's blocks draw. */
function backgrounds(tree: ComponentNode[], data: SiteData): string[] {
  const urls = allNodes(tree).flatMap((node) => {
    const block = getBlock(node.type);
    return block
      ? blockItems(block, node.props as BlockProps, data, true).map(
          ({ item }) => tintSource(block, item),
        )
      : [];
  });
  return [...new Set(urls.filter((url): url is string => !!url))];
}
