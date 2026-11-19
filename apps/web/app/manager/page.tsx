import { ArrowRight, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';
import { Card, H1, Paragraph } from '@scottcheung/ui';
import { PageContainer } from '@/components/manager/PageContainer';
import { countPagesBySite } from '@/lib/db/pages';
import { listSites } from '@/lib/db/sites';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';

export const dynamic = 'force-dynamic';

export default async function ManagerHome() {
  const [sites, pageCounts] = await Promise.all([
    listSites(),
    countPagesBySite(),
  ]);

  return (
    <PageContainer>
      <div>
        <span className="sc-ui-overline">Workspace</span>
        <H1 className="mt-1">Your sites</H1>
        <Paragraph className="mt-1">
          Choose a site to create and edit its pages.
        </Paragraph>
      </div>

      {sites.length === 0 && (
        <Card>
          No sites yet. Run <code>npm run seed</code> to create the two sample
          sites.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => {
          const { colors } = resolveTheme(defaultTheme, site.theme);
          const count = pageCounts[site.slug] ?? 0;
          return (
            <Card
              key={site.id}
              className="group flex flex-col gap-5 transition hover:shadow-[var(--ui-shadow-md)]"
            >
              {/* A small preview of the site's colours. */}
              <div
                className="flex h-28 items-end justify-between rounded-2xl p-4 ring-1 ring-black/5"
                style={{ background: colors.background, color: colors.text }}
              >
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: colors.brand,
                    color: colors.brandContrast,
                  }}
                >
                  {site.name}
                </span>
                <span className="flex gap-1.5">
                  {[colors.brand, colors.surfaceLight, colors.text].map(
                    (colour) => (
                      <span
                        key={colour}
                        className="size-5 rounded-full ring-2 ring-white/60"
                        style={{ background: colour }}
                      />
                    ),
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {site.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={site.logoUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="sc-ui-typography sc-ui-h2">{site.name}</h2>
                  <p className="m-0 flex items-center gap-1.5 text-xs text-[var(--ui-muted)]">
                    <FileText className="size-3.5" />
                    {count} {count === 1 ? 'page' : 'pages'} · /sites/
                    {site.slug}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/manager/${site.slug}`} className="sc-ui-button">
                  Manage pages <ArrowRight />
                </Link>
                <a
                  href={`/sites/${site.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sc-ui-button"
                  data-variant="secondary"
                >
                  View site <ExternalLink />
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
