import { notFound } from 'next/navigation';
import { RenderTree } from '@/components/render-tree';
import { getPage, getSites } from '@/lib/repository';
import { normalizePath } from '@/lib/model';
import type { PageDocument } from '@/lib/model';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ siteSlug: string; path?: string[] }>;
}) {
  const { siteSlug, path = [] } = await params;
  let sites: Awaited<ReturnType<typeof getSites>>;
  try {
    sites = await getSites();
  } catch {
    notFound();
  }
  const site = sites.find((item) => item.slug === siteSlug);
  if (!site) notFound();
  const pagePath = normalizePath(path.join('/'));
  let page: PageDocument | null;
  try {
    page = await getPage(site.id, pagePath);
  } catch {
    notFound();
  }
  if (!page || page.status !== 'published') notFound();
  const style = {
    '--brand': site.theme.brand,
    '--accent': site.theme.accent,
    '--surface': site.theme.surface,
    '--site-bg': site.theme.background,
    '--site-text': site.theme.text,
    '--muted': site.theme.muted,
  } as CSSProperties;
  return (
    <main className="public-site" style={style}>
      <header className="public-header">
        <a className="public-mark" href={`/s/${site.slug}`}>
          {site.name}
        </a>
        <nav>
          <a href="#news">News</a>
          <a href="#team">Teams</a>
          <a href="#team">Fixtures</a>
          <a href="#about">About</a>
        </nav>
        <a className="public-header-cta" href="#team">
          Match centre ↗
        </a>
      </header>
      <div className="public-page">
        <div className="public-kicker">
          <span></span>
          {site.description}
        </div>
        <h1 className="public-title">{page.title}</h1>
        <RenderTree
          components={page.components}
          theme={site.theme}
          siteSlug={site.slug}
        />
      </div>
      <footer className="public-footer">
        <span>{site.name}</span>
        <span>Powered by Rugby AU Site Manager</span>
      </footer>
    </main>
  );
}
