import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Container } from '@/components/primitives/Container';
import { RenderTree } from '@/components/site/RenderTree';
import { getPageByPath } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { pathFromSegments } from '@/lib/paths';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import { SiteLogo } from '@/components/primitives/SiteLogo';

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

  return (
    <div
      style={themeToCssVars(theme)}
      className="@container flex min-h-screen flex-col bg-background font-site text-text"
    >
      <header className="bg-brand text-brand-contrast">
        <Container className="flex items-center gap-3 py-4">
          <a
            href={`/sites/${site.slug}`}
            className="flex items-center gap-3 text-xl font-bold"
          >
            <SiteLogo src={site.logoUrl} name={site.name} />
            {site.name}
          </a>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="flex flex-col gap-site-md py-site-lg">
          <h1 className="sr-only">{page.title}</h1>
          {page.tree.length > 0 ? (
            <RenderTree nodes={page.tree} siteSlug={site.slug} />
          ) : (
            <p className="text-muted-text">This page has no content yet.</p>
          )}
        </Container>
      </main>

      <footer className="border-t border-muted-text/20 py-6 text-sm text-muted-text">
        <Container className="flex flex-wrap justify-between gap-2">
          <span>© {site.name}</span>
          <span>{site.tagline}</span>
        </Container>
      </footer>
    </div>
  );
}
