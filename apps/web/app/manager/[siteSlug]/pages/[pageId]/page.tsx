import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/PageEditor';
import { getPageById } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';

export const dynamic = 'force-dynamic';

export default async function EditPage({
  params,
}: {
  params: Promise<{ siteSlug: string; pageId: string }>;
}) {
  const { siteSlug, pageId } = await params;
  const [site, page] = await Promise.all([
    getSiteBySlug(siteSlug),
    getPageById(pageId),
  ]);
  if (!site || !page || page.siteSlug !== site.slug) notFound();
  return <PageEditor site={site} page={page} />;
}
