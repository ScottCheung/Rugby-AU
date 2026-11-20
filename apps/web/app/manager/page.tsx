import { ArrowRight, ExternalLink, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, H1, Paragraph } from '@scottcheung/ui';
import { PageContainer } from '@/components/manager/PageContainer';
import { SiteLogo } from '@/components/primitives/SiteLogo';
import { countPagesBySite } from '@/lib/db/pages';
import { listSites } from '@/lib/db/sites';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { siteCategories, siteCategoryLabels, type Site } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ManagerHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim().toLowerCase();
  const [allSites, pageCounts] = await Promise.all([
    listSites(),
    countPagesBySite(),
  ]);
  const sites = query
    ? allSites.filter((site) =>
        `${site.name} ${site.slug} ${site.tagline}`
          .toLowerCase()
          .includes(query),
      )
    : allSites;

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="sc-ui-overline">Workspace</span>
          <H1 className="mt-1">Your sites</H1>
          <Paragraph className="mt-1">
            {allSites.length} sites share one component library. Choose one to
            edit its pages.
          </Paragraph>
        </div>
        {/* A plain GET form: search works without JavaScript and the URL can be shared. */}
        <form className="relative w-full sm:w-72" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--ui-faint)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search sites"
            aria-label="Search sites"
            className="sc-ui-input"
            // Inline, because the UI library's own input padding outranks Tailwind's layered utilities.
            style={{ paddingLeft: '2.5rem' }}
          />
        </form>
      </div>

      {allSites.length === 0 && (
        <Card>
          No sites yet. Run <code>npm run seed</code> to create the sample
          sites.
        </Card>
      )}
      {allSites.length > 0 && sites.length === 0 && (
        <Card>
          No sites match “{q}”.{' '}
          <Link href="/manager" className="text-[var(--ui-primary)] underline">
            Show all sites
          </Link>
        </Card>
      )}

      {siteCategories.map((category) => {
        const group = sites.filter((site) => site.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-3">
            <span className="sc-ui-overline">
              {siteCategoryLabels[category]} · {group.length}
            </span>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  pageCount={pageCounts[site.slug] ?? 0}
                />
              ))}
            </div>
          </section>
        );
      })}
    </PageContainer>
  );
}

function SiteCard({ site, pageCount }: { site: Site; pageCount: number }) {
  const { colors } = resolveTheme(defaultTheme, site.theme);
  return (
    <Card className="flex flex-col gap-4 p-4 transition hover:shadow-[var(--ui-shadow-md)]">
      {/* A small preview of the site's colours. */}
      <div
        className="flex h-20 items-end justify-between rounded-2xl p-3 ring-1 ring-black/5"
        style={{ background: colors.background, color: colors.text }}
      >
        <SiteLogo src={site.logoUrl} name={site.name} size="lg" />
        <span className="flex gap-1">
          {[colors.brand, colors.surfaceLight, colors.text].map(
            (colour, index) => (
              <span
                key={index}
                className="size-4 rounded-full ring-2 ring-white/60"
                style={{ background: colour }}
              />
            ),
          )}
        </span>
      </div>
      <div className="min-w-0">
        <h2 className="sc-ui-typography sc-ui-h2 truncate">{site.name}</h2>
        <p className="m-0 line-clamp-1 text-xs text-[var(--ui-muted)]">
          {site.tagline}
        </p>
        <p className="m-0 mt-1 flex items-center gap-1.5 text-xs text-[var(--ui-faint)]">
          <FileText className="size-3.5" />
          {pageCount} {pageCount === 1 ? 'page' : 'pages'} · /sites/{site.slug}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/manager/${site.slug}`}
          className="sc-ui-button"
          data-size="sm"
        >
          Manage pages <ArrowRight />
        </Link>
        <a
          href={`/sites/${site.slug}`}
          target="_blank"
          rel="noreferrer"
          className="sc-ui-button"
          data-variant="secondary"
          data-size="sm"
        >
          View site <ExternalLink />
        </a>
      </div>
    </Card>
  );
}
