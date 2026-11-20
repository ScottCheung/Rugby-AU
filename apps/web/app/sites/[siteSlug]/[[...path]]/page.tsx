import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Container } from '@/components/primitives/Container';
import { RenderTree } from '@/components/site/RenderTree';
import { SiteMotion } from '@/components/site/Reveal';
import { rootBlockWidth } from '@/lib/components/pageWidth';
import { summarizeArticles } from '@/lib/news';
import { profileBackgrounds } from '@/lib/components/profileGrid';
import { cardColors } from '@/lib/imageColor';
import { getPageByPath, listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import { SiteLogo } from '@/components/primitives/SiteLogo';
import { SiteHeader } from '@/components/site/SiteHeader';
import { resolveHref } from '@/lib/links';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ siteSlug: string; path?: string[] }> };

/** Site + path -> page. cache() lets metadata and the page share one lookup. */
const loadPage = cache(async (siteSlug: string, segments?: string[]) => {
  const site = await getSiteBySlug(siteSlug);
  if (!site) return null;
  const page = await getPageByPath(site.slug, pathFromSegments(segments));
  return page ? { site, page } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) return {};
  const { site, page } = found;
  return {
    title: `${page.title} | ${site.name}`,
    description: page.description ?? site.tagline,
    icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
  };
}

export default async function SitePage({ params }: Props) {
  const { siteSlug, path } = await params;
  const found = await loadPage(siteSlug, path);
  if (!found) notFound();
  const { site, page } = found;
  const theme = resolveTheme(defaultTheme, site.theme);
  // The menu is the site's top-level pages, so a page created in the
  // manager shows up here without any extra setup. "/" sorts first.
  const sitePages = await listPages(site.slug);
  const menu = sitePages.filter((item) => item.path.split('/').length === 2);
  // For Latest news: every article on the site, newest first.
  // Profile cards take their colour from their photos, worked out here on
  // the server so the page arrives with the right colours.
  const data = {
    articles: summarizeArticles(sitePages),
    pagePath: page.path,
    colors: await cardColors(profileBackgrounds(page.tree)),
  };
  // An article shows its own headline as the page's h1.
  const hasOwnHeading = page.tree[0]?.type === 'article';
  const heroFirst =
    !!page.tree[0] && rootBlockWidth(page.tree[0]) === 'full-width';

  return (
    <div
      style={themeToCssVars(theme)}
      className="@container/page flex min-h-screen flex-col bg-background font-site text-text"
    >
      {/* A full-width first block is a hero: the header floats over it. */}
      <SiteHeader
        siteName={site.name}
        logoUrl={site.logoUrl}
        homeHref={`/sites/${site.slug}`}
        editHref={
          process.env.NODE_ENV === 'development'
            ? `/manager/${site.slug}/pages/${page.id}`
            : undefined
        }
        managerHref={process.env.NODE_ENV === 'development' ? '/manager' : undefined}
        overlay={heroFirst}
        links={menu.map((item) => ({
          id: item.id,
          href: resolveHref(item.path, site.slug) ?? '#',
          label: item.path === '/' ? 'Home' : item.title,
          current: item.path === page.path,
        }))}
      />
      {!heroFirst && <div aria-hidden className="h-16 md:h-[72px]" />}

      {/* No page-wide container: each block decides its width (RenderTree). */}
      <main
        className={`flex flex-1 flex-col pb-site-lg ${
          heroFirst ? '' : 'pt-site-lg'
        }`}
      >
        {!hasOwnHeading && <h1 className="sr-only">{page.title}</h1>}
        {page.tree.length > 0 ? (
          <>
            {/* Without JavaScript, entrance animations never run: show it all. */}
            <noscript>
              <style>{`main [style*="opacity:0"]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
            </noscript>
            <SiteMotion>
              <RenderTree nodes={page.tree} siteSlug={site.slug} data={data} />
            </SiteMotion>
          </>
        ) : (
          <Container>
            <p className="text-muted-text">This page has no content yet.</p>
          </Container>
        )}
      </main>

      <footer className="surface-strong bg-brand py-site-md text-sm text-brand-contrast">
        <Container className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex max-w-sm flex-col gap-3">
              <span className="site-heading flex items-center gap-3 text-lg font-bold">
                <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
                {site.name}
              </span>
              <span className="opacity-80">{site.tagline}</span>
            </div>
            <nav aria-label="Footer">
              <ul className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-2 p-0">
                {menu.map((item) => (
                  <li key={item.id}>
                    <a
                      href={resolveHref(item.path, site.slug)}
                      className="opacity-80 hover:underline hover:opacity-100"
                    >
                      {item.path === '/' ? 'Home' : item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <span className="border-t border-current/20 pt-4 opacity-70">
            © {site.name}. A demo site with sample content.
          </span>
        </Container>
      </footer>
    </div>
  );
}
