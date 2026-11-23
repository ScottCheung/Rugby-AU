import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { SitePage } from '@/components/site/SitePage';
import { collections, isCollection } from '@/lib/collections';
import { getEntry, listEntries } from '@/lib/db/entries';
import {
  getPublishedPage,
  getTemplatePage,
  listPublishedPages,
} from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { pageData, siteMenu } from '@/lib/render/pageData';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ siteSlug: string; path?: string[] }> };

/**
 * Site + path -> what to show. Only published content is ever read here:
 * a draft, or a page never published, is a 404. An address with no page of
 * its own, /<collection>/<slug> (/news/<slug>), is a published entry of a
 * collection that has pages, drawn by the site's template for it. cache() lets the metadata and the page share one lookup.
 */
const loadPage = cache(async (siteSlug: string, segments?: string[]) => {
  const site = await getSiteBySlug(siteSlug);
  if (!site) return null;
  const path = pathFromSegments(segments);
  const page = await getPublishedPage(site.slug, path);
  if (page) return { site, page, entry: undefined };

  const [collection, slug, ...rest] = segments ?? [];
  if (
    !collection ||
    !slug ||
    rest.length > 0 ||
    !isCollection(collection) ||
    !collections[collection].hasPage
  )
    return null;
  const entry = await getEntry(site.slug, collection, slug);
  if (!entry || entry.status !== 'published') return null;
  const template = await getTemplatePage(site.slug, collection);
  if (!template?.published) return null;
  return {
    site,
    entry,
    page: {
      id: template.id,
      path,
      content: template.published,
    },
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) return {};
  const { site, page, entry } = found;
  const definition = entry && collections[entry.collection];
  return {
    title: `${definition ? definition.titleOf(entry.data) : page.content.title} | ${site.name}`,
    description:
      (definition && definition.summaryOf?.(entry.data)) ||
      page.content.description ||
      site.tagline,
    icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
  };
}

/** The public site: server-rendered, resolved by site + path, 404 otherwise. */
export default async function PublicPage({ params }: Props) {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) notFound();
  const { site, page, entry } = found;
  const [sitePages, entries] = await Promise.all([
    listPublishedPages(site.slug),
    listEntries(site.slug, { publishedOnly: true }),
  ]);
  const dev = process.env.NODE_ENV === 'development';

  return (
    <SitePage
      site={site}
      themeVars={themeToCssVars(resolveTheme(defaultTheme, site.theme))}
      title={
        (entry?.data as { headline?: string } | undefined)?.headline ??
        page.content.title
      }
      path={page.path}
      components={page.content.components}
      menu={siteMenu(sitePages, site.menuOrder)}
      data={await pageData({
        entries,
        entry,
        path: page.path,
        components: page.content.components,
      })}
      editHref={dev ? `/manager/${site.slug}/pages/${page.id}` : undefined}
      managerHref={dev ? '/manager' : undefined}
    />
  );
}
