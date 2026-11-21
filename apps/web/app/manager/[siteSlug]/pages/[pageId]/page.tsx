import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/manager/editor/PageEditor';
import { getPageById, listPages } from '@/lib/db/pages';
import { getSiteBySlug, listSites } from '@/lib/db/sites';
import { collectImages } from '@/lib/media';
import { summarizeArticles } from '@/lib/news';
import { profileBackgrounds } from '@/lib/components/profileGrid';
import { cardColors } from '@/lib/imageColor';
import { getFixtures } from '@/lib/fixtures/mockApi';

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
  const now = new Date();
  // The site's image library: every image its pages already use.
  const images = collectImages(sitePages.map((sitePage) => sitePage.tree));
  return (
    <PageEditor
      site={site}
      page={page}
      sites={sites.map(({ slug, name }) => ({ slug, name }))}
      pages={sitePages.map(({ id, title, path }) => ({ id, title, path }))}
      images={images}
      articles={summarizeArticles(sitePages)}
      colors={await cardColors(profileBackgrounds(page.tree))}
      // Every match, not only the page's teams: an editor can switch a
      // Fixture list to any team and the canvas follows straight away.
      fixtures={await getFixtures({ now })}
      now={now.toISOString()}
    />
  );
}
