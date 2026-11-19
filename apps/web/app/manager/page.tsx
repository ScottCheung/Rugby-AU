import Link from 'next/link';
import { Badge, Card, H1, Paragraph } from '@scottcheung/ui';
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
    <div className="flex flex-col gap-6">
      <div>
        <H1 className="m-0">Your sites</H1>
        <Paragraph className="mt-1 text-slate-600">
          Choose a site to create and edit its pages.
        </Paragraph>
      </div>

      {sites.length === 0 && (
        <Card>
          No sites yet. Run <code>npm run seed</code> to create the two sample
          sites.
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sites.map((site) => {
          const { colors } = resolveTheme(defaultTheme, site.theme);
          const count = pageCounts[site.slug] ?? 0;
          return (
            <Card key={site.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {site.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={site.logoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 text-lg font-semibold">{site.name}</h2>
                  <p className="m-0 text-sm text-slate-500">
                    /sites/{site.slug}
                  </p>
                </div>
                <Badge tone="neutral">
                  {count} {count === 1 ? 'page' : 'pages'}
                </Badge>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-slate-500"
                aria-label="Theme colours"
              >
                {[colors.brand, colors.background, colors.text].map(
                  (colour) => (
                    <span
                      key={colour}
                      className="size-6 rounded-full border border-slate-200"
                      style={{ background: colour }}
                    />
                  ),
                )}
                Theme
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/manager/${site.slug}`}
                  className="sc-ui-button"
                  data-size="sm"
                >
                  Manage pages
                </Link>
                <a
                  href={`/sites/${site.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sc-ui-button"
                  data-variant="secondary"
                  data-size="sm"
                >
                  View site ↗
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
