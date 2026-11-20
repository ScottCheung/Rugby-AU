import { ChevronRight, ExternalLink, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Card, H1, NotchCard, Paragraph } from '@scottcheung/ui';
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
            {/* Extra room between rows: each card's logo rises above it. */}
            <div className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
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

/**
 * One site, in its own colours: a notch card (from @scottcheung/ui) painted
 * with the site's brand colour, its logo rising out of the top right. The
 * whole card opens the site's pages; "View site" opens the public site.
 */
function SiteCard({ site, pageCount }: { site: Site; pageCount: number }) {
  const { colors } = resolveTheme(defaultTheme, site.theme);
  return (
    <NotchCard
      title={site.name}
      className="group relative h-full transition-transform duration-300 hover:scale-[1.02]"
      style={
        {
          '--sc-notch-bg': colors.brand,
          '--sc-notch-fg': colors.brandContrast,
        } as CSSProperties
      }
    >
      <div className="flex h-full items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="m-0 line-clamp-3 text-sm leading-relaxed opacity-85">
            {site.tagline}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-current/15 px-2.5 py-1">
              <FileText aria-hidden className="size-3.5" />
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
            {/* Above the card's own link (z-index), so it stays clickable. */}
            <a
              href={`/sites/${site.slug}`}
              target="_blank"
              rel="noreferrer"
              className="relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 opacity-80 transition hover:bg-current/15 hover:opacity-100"
            >
              View site <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>
        {/* The logo rises out of the card, beside the tab. */}
        <div className="-mt-[60px] flex shrink-0 flex-col items-center">
          <SiteLogo src={site.logoUrl} name={site.name} size="md" />
        </div>
      </div>
      <Link
        href={`/manager/${site.slug}`}
        aria-label={`Manage the pages of ${site.name}`}
        className="stretched-link"
      />
      <span
        aria-hidden
        className="absolute right-5 bottom-5 grid size-8 place-items-center rounded-full bg-current/15 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ChevronRight className="size-4" />
      </span>
    </NotchCard>
  );
}
