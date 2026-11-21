import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/editor/PageEditor';
import { getPageById, listPages } from '@/lib/db/pages';
import { getSiteBySlug, listSites } from '@/lib/db/sites';
import { collectImages } from '@/lib/media';

export const dynamic = 'force-dynamic';

export default async function EditPage({
  params,
}: {
  params: Promise<{ siteSlug: string; pageId: string }>;
}) {
  const { siteSlug, pageId } = await params;
  const [site, page, sitePages, sites] = await Promise.all([
    getSiteBySlug(siteSlug),
    getPageById(pageId),
    listPages(siteSlug),
    listSites(),
  ]);
  if (!site || !page || page.siteSlug !== site.slug) notFound();
  return (
    <PageEditor
      site={site}
      page={page}
      sites={sites.map(({ slug, name }) => ({ slug, name }))}
      pages={sitePages.map(({ id, draft, path }) => ({
        id,
        title: draft.title,
        path,
      }))}
      // The site's image library: every image its pages already use.
      images={collectImages(
        sitePages.map((sitePage) => sitePage.draft.components),
      )}
    />
  );
}
