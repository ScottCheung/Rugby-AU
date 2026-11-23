import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/editor/PageEditor';
import { getPageById, listPages } from '@/lib/db/pages';
import { getSiteBySlug, listSites } from '@/lib/db/sites';
import { isCollection } from '@/lib/collections';
import { pageData } from '@/lib/render/pageData';
import { collectImages } from '@/lib/media';
import { summarizeEntry } from '@/lib/collections';
import { listEntries } from '@/lib/db/entries';

export const dynamic = 'force-dynamic';

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string; pageId: string }>;
  searchParams: Promise<{ panel?: string }>;
}) {
  const { siteSlug, pageId } = await params;
  const { panel } = await searchParams;
  const [site, page, sitePages, sites, entries] = await Promise.all([
    getSiteBySlug(siteSlug),
    getPageById(pageId),
    listPages(siteSlug),
    listSites(),
    listEntries(siteSlug),
  ]);
  if (!site || !page || page.siteSlug !== site.slug) notFound();
  const published = entries.filter((entry) => entry.status === 'published');
  return (
    <PageEditor
      site={site}
      page={page}
      sites={sites.map(({ slug, name, logoUrl }) => ({ slug, name, logoUrl }))}
      pages={sitePages.map(({ id, draft, path }) => ({
        id,
        title: draft.title,
        path,
      }))}
      // The site's image library: every image its pages already use.
      images={collectImages(
        sitePages.map((sitePage) => sitePage.draft.components),
        entries.map((entry) => entry.data),
      )}
      // The site's own content, to pick from or open.
      entries={entries.map(summarizeEntry)}
      // What its blocks show: the same data the preview renders with.
      data={await pageData({
        entries: published,
        path: page.path,
        components: page.draft.components,
        // An article template shows a sample: the newest entry.
        entry: page.template
          ? published.find((entry) => entry.collection === page.template)
          : undefined,
        everything: true,
      })}
      initialPanel={
        panel === 'site' || (panel && isCollection(panel)) ? panel : undefined
      }
    />
  );
}
