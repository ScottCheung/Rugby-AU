import { Suspense } from 'react';
import {
  SitesBrowser,
  type SiteSummary,
} from '@/components/manager/SitesBrowser';
import { countPagesBySite } from '@/lib/db/pages';
import { listSites } from '@/lib/db/sites';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { colourFamily } from '@/lib/theme/colourFamily';
import { fontStack } from '@/lib/theme/fonts';
import { fontLabels, matchLook } from '@/lib/theme/looks';
import { resolveTheme } from '@/lib/theme/resolveTheme';

export const dynamic = 'force-dynamic';

/**
 * Every site, as a dashboard. The server reads the sites and resolves each
 * theme's colours; searching, filtering and sorting happen in the browser
 * (SitesBrowser), so the list reacts as you type.
 */
export default async function ManagerHome() {
  const [sites, pageCounts] = await Promise.all([
    listSites(),
    countPagesBySite(),
  ]);
  const summaries: SiteSummary[] = sites.map((site) => {
    const theme = resolveTheme(defaultTheme, site.theme);
    const look = matchLook(theme);
    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      tagline: site.tagline,
      category: site.category,
      logoUrl: site.logoUrl,
      pageCount: pageCounts[site.slug] ?? 0,
      colors: theme.colors,
      colourFamily: colourFamily(theme.colors.brand),
      look: {
        id: look?.id ?? 'custom',
        name: look?.name ?? 'Custom',
        description:
          look?.description ?? 'Its own type and corners, not a shared look.',
        headingFont: fontStack(theme.fonts.heading),
        headingFontLabel: fontLabels[theme.fonts.heading] ?? 'Inter',
        uppercase: theme.headingCase === 'uppercase',
        radius: theme.radius,
      },
    };
  });
  return (
    // useSearchParams in the browser needs a Suspense boundary.
    <Suspense fallback={null}>
      <SitesBrowser sites={summaries} />
    </Suspense>
  );
}
