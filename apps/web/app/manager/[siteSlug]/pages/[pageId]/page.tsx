import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/editor/PageEditor';
import { getPageById, listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { collectImages } from '@/lib/media';

export const dynamic = 'force-dynamic';

export default async function EditPage({
  params,
}: {
  params: Promise<{ siteSlug: string; pageId: string }>;
}) {
  const { siteSlug, pageId } = await params;
  const [site, page, sitePages] = await Promise.all([
    getSiteBySlug(siteSlug),
    getPageById(pageId),
    listPages(siteSlug),
  ]);
  if (!site || !page || page.siteSlug !== site.slug) notFound();
  // The site's image library: every image its pages already use.
  const images = collectImages(sitePages.map((sitePage) => sitePage.tree));
  return <PageEditor site={site} page={page} images={images} />;
}
