import { profileBackgrounds } from '../components/profileGrid';
import { getFixtures } from '../fixtures/mockApi';
import { fixturesForTree } from '../fixtures/forTree';
import { cardColors } from '../imageColor';
import { summarizeArticles, type SiteData } from '../news';
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

/** The site menu: its published top-level pages ("/" sorts first). */
export function siteMenu(sitePages: Page[]): MenuItem[] {
  return publishedOnly(sitePages)
    .filter((page) => page.path.split('/').length === 2)
    .map(({ id, path, content }) => ({ id, path, title: content.title }));
}

/**
 * What data-driven components need to render a page: the site's articles
 * (Latest news), colours picked from photos (Profile cards) and matches
 * (Fixture list). Worked out on the server, before the page renders.
 *
 * `allFixtures` is for the editor's preview: an editor can switch a
 * Fixture list to any team, so the preview gets every match up front.
 * The component filters by team itself, so the result looks the same.
 */
export async function pageData({
  sitePages,
  path,
  components,
  allFixtures = false,
}: {
  sitePages: Page[];
  path: string;
  components: ComponentNode[];
  allFixtures?: boolean;
}): Promise<SiteData> {
  const now = new Date();
  return {
    articles: summarizeArticles(
      publishedOnly(sitePages).map(({ path, content }) => ({
        path,
        tree: content.components,
      })),
    ),
    pagePath: path,
    colors: await cardColors(profileBackgrounds(components)),
    fixtures: allFixtures
      ? await getFixtures({ now })
      : await fixturesForTree(components, now),
    now: now.toISOString(),
  };
}
