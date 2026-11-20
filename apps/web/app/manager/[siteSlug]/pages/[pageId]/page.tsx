import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/editor/PageEditor';
import { getPageById, listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { collectImages } from '@/lib/media';
import { summarizeArticles } from '@/lib/news';
import { profileBackgrounds } from '@/lib/components/profileGrid';
import { cardColors } from '@/lib/imageColor';

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
  // The same menu the public header shows: top-level pages only.
  const menu = sitePages
    .filter((item) => item.path.split('/').length === 2)
    .map((item) => ({
      id: item.id,
      label: item.path === '/' ? 'Home' : item.title,
      current: item.id === page.id,
    }));
  return (
    <PageEditor
      site={site}
      page={page}
      menu={menu}
      images={images}
      articles={summarizeArticles(sitePages)}
      colors={await cardColors(profileBackgrounds(page.tree))}
    />
  );
}
