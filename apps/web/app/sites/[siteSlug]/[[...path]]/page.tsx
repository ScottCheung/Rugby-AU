import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Container } from '@/components/primitives/Container';
import { RenderTree } from '@/components/site/RenderTree';
import { rootBlockWidth } from '@/lib/components/pageWidth';
import { getPageByPath, listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import { SiteLogo } from '@/components/primitives/SiteLogo';
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
  const menu = (await listPages(site.slug)).filter(
    (item) => item.path.split('/').length === 2,
  );

  return (
    <div
      style={themeToCssVars(theme)}
      className="@container flex min-h-screen flex-col bg-background font-site text-text"
    >
      <header className="bg-brand text-brand-contrast">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <a
            href={`/sites/${site.slug}`}
            className="site-heading flex shrink-0 items-center gap-3 text-xl font-bold"
          >
            <SiteLogo src={site.logoUrl} name={site.name} />
            {site.name}
          </a>
          <nav aria-label="Main" className="-mx-2 max-w-full overflow-x-auto">
            <ul className="m-0 flex list-none gap-1 p-0 whitespace-nowrap">
              {menu.map((item) => {
                const current = item.path === page.path;
                return (
                  <li key={item.id}>
                    <a
                      href={resolveHref(item.path, site.slug)}
                      aria-current={current ? 'page' : undefined}
                      className={`block rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                        current
                          ? 'bg-brand-contrast text-brand'
                          : 'hover:bg-brand-contrast/15'
                      }`}
                    >
                      {item.path === '/' ? 'Home' : item.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      </header>

      {/* No page-wide container: each block decides its width (RenderTree). */}
      <main
        className={`flex flex-1 flex-col gap-site-md pb-site-lg ${
          page.tree[0] && rootBlockWidth(page.tree[0]) === 'full-width'
            ? '' // an edge-to-edge first block sits right under the header
            : 'pt-site-lg'
        }`}
      >
        <h1 className="sr-only">{page.title}</h1>
        {page.tree.length > 0 ? (
          <RenderTree nodes={page.tree} siteSlug={site.slug} />
        ) : (
          <Container>
            <p className="text-muted-text">This page has no content yet.</p>
          </Container>
        )}
      </main>

      <footer className="bg-brand py-site-md text-sm text-brand-contrast">
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
