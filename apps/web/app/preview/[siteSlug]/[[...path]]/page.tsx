import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LivePreview } from '@/components/preview/LivePreview';
import { listEntries } from '@/lib/db/entries';
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
 * re-renders whatever draft the editor posts to it. It starts from the
 * saved draft, never published-only data, so unpublished pages work too.
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
  const [sitePages, entries] = await Promise.all([
    listPages(site.slug),
    listEntries(site.slug, { publishedOnly: true }),
  ]);
  // An article template shows a sample: the newest entry.
  const sample = page.template
    ? entries.find((entry) => entry.collection === page.template)
    : undefined;

  return (
    <LivePreview
      site={site}
      themeVars={themeToCssVars(resolveTheme(defaultTheme, site.theme))}
      path={page.path}
      menu={siteMenu(sitePages, site.menuOrder)}
      data={await pageData({
        entries,
        entry: sample,
        path: page.path,
        components: page.draft.components,
        everything: true,
      })}
      initialTitle={page.draft.title}
      initialComponents={page.draft.components}
    />
  );
}
