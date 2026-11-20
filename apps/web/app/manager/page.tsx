import { Suspense } from 'react';
import {
  SitesBrowser,
  type SiteSummary,
} from '@/components/manager/SitesBrowser';
import { countPagesBySite } from '@/lib/db/pages';
import { listSites } from '@/lib/db/sites';
import { defaultTheme } from '@/lib/theme/defaultTheme';
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
    const { colors } = resolveTheme(defaultTheme, site.theme);
    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      tagline: site.tagline,
      category: site.category,
      logoUrl: site.logoUrl,
      pageCount: pageCounts[site.slug] ?? 0,
      colors: { brand: colors.brand, brandContrast: colors.brandContrast },
    };
  });
  return (
    // useSearchParams in the browser needs a Suspense boundary.
    <Suspense fallback={null}>
      <SitesBrowser sites={summaries} />
    </Suspense>
  );
}
