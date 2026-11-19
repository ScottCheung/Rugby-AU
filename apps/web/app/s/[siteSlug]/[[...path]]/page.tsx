import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { RenderTree } from '@/components/site/render-tree';
import { resolveSiteHref } from '@/lib/links';
import { normalizePath } from '@/lib/model';
import { getPage, getSiteBySlug } from '@/lib/repository';
import { themeToCssVars } from '@/lib/theme';
import '../../site.css';

export const dynamic = 'force-dynamic';

type Params = Promise<{ siteSlug: string; path?: string[] }>;

/** Site + path -> page. Cached so metadata and the page share one lookup. */
const resolvePage = cache(async (siteSlug: string, path: string[]) => {
  const site = await getSiteBySlug(siteSlug);
  if (!site) return null;
  const page = await getPage(site.id, normalizePath(path.join('/')));
  if (!page || page.status !== 'published') return null;
  return { site, page };
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { siteSlug, path = [] } = await params;
  const resolved = await resolvePage(siteSlug, path);
  if (!resolved) return {};
  const { site, page } = resolved;
  return {
    title: page.path === '/' ? site.name : `${page.title} | ${site.name}`,
    description: site.description,
  };
}

export default async function PublicSitePage({ params }: { params: Params }) {
  const { siteSlug, path = [] } = await params;
  const resolved = await resolvePage(siteSlug, path);
  if (!resolved) notFound();
  const { site, page } = resolved;

  return (
    <main className="public-site" style={themeToCssVars(site.theme)}>
      <header className="public-header">
        <a className="public-mark" href={`/s/${site.slug}`}>
          {site.name}
        </a>
        <nav aria-label={`${site.name} navigation`}>
          {site.navigation.map((item) => (
            <a
              key={item.href}
              href={resolveSiteHref(item.href, site.slug)}
              aria-current={item.href === page.path ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <div className="public-page">
        <div className="public-kicker">
          <span></span>
          {site.description}
        </div>
        <h1 className="public-title">{page.title}</h1>
        <RenderTree
          components={page.components}
          context={{ siteSlug: site.slug }}
        />
      </div>
      <footer className="public-footer">
        <span>{site.name}</span>
        <span>Powered by Rugby AU Site Manager</span>
      </footer>
    </main>
  );
}
