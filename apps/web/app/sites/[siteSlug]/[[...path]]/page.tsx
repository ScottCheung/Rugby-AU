import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { SitePage } from '@/components/site/SitePage';
import { getPublishedPage, listPublishedPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { pageData, siteMenu } from '@/lib/render/pageData';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ siteSlug: string; path?: string[] }> };

/**
 * Site + path -> the published page. Only published content is ever read
 * here: a draft, or a page never published, is a 404. cache() lets the
 * metadata and the page share one lookup.
 */
const loadPage = cache(async (siteSlug: string, segments?: string[]) => {
  const site = await getSiteBySlug(siteSlug);
  if (!site) return null;
  const page = await getPublishedPage(site.slug, pathFromSegments(segments));
  return page ? { site, page } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) return {};
  const { site, page } = found;
  return {
    title: `${page.content.title} | ${site.name}`,
    description: page.content.description ?? site.tagline,
    icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
  };
}

/** The public site: server-rendered, resolved by site + path, 404 otherwise. */
export default async function PublicPage({ params }: Props) {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) notFound();
  const { site, page } = found;
  const sitePages = await listPublishedPages(site.slug);
  const dev = process.env.NODE_ENV === 'development';

  return (
    <SitePage
      site={site}
      themeVars={themeToCssVars(resolveTheme(defaultTheme, site.theme))}
      title={page.content.title}
      path={page.path}
      components={page.content.components}
      menu={siteMenu(sitePages)}
      data={await pageData({
        sitePages,
        path: page.path,
        components: page.content.components,
      })}
      editHref={dev ? `/manager/${site.slug}/pages/${page.id}` : undefined}
      managerHref={dev ? '/manager' : undefined}
    />
  );
}
