import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LivePreview } from '@/components/preview/LivePreview';
import { getPageByPath, listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { pageData, siteMenu } from '@/lib/render/pageData';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false } };

/**
 * The editor's preview, loaded once in an iframe. It renders the same
 * SitePage as the public route, with the same theme and site CSS, then
 * re-renders whatever draft the editor posts to it.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ siteSlug: string; path?: string[] }>;
}) {
  const { siteSlug, path } = await params;
  const site = await getSiteBySlug(siteSlug);
  const page = site && (await getPageByPath(site.slug, pathFromSegments(path)));
  if (!site || !page) notFound();
  const sitePages = await listPages(site.slug);

  return (
    <LivePreview
      site={site}
      themeVars={themeToCssVars(resolveTheme(defaultTheme, site.theme))}
      path={page.path}
      menu={siteMenu(sitePages)}
      data={await pageData({
        sitePages,
        path: page.path,
        components: page.tree,
        allFixtures: true,
      })}
      initialTitle={page.title}
      initialComponents={page.tree}
    />
  );
}
