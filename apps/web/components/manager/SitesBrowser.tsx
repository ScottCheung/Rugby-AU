'use client';

import {
  ChevronRight,
  ExternalLink,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { NotchCard } from '@scottcheung/ui';
import {
  Checkbox,
  Drawer,
  IconButton,
  SegmentedControl,
} from '@scottcheung/ui/client';
import { SiteLogo } from '@/components/primitives/SiteLogo';
import {
  siteCategories,
  siteCategoryLabels,
  type SiteCategory,
} from '@/lib/types';

/** What the list needs to know about a site; colours already resolved. */
export type SiteSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: SiteCategory;
  logoUrl?: string;
  pageCount: number;
  colors: { brand: string; brandContrast: string };
};

type Sort = 'name' | 'pages';
type View = 'grid' | 'list';

/**
 * The site list with its toolbar: search, a Filter & Sort drawer and a grid
 * or list view. Everything lives in the URL (?q, category, sort, view), so a
 * filtered list can be shared and the sidebar can link to a kind of site.
 */
export function SitesBrowser({ sites }: { sites: SiteSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const categories = (params.get('category') ?? '')
    .split(',')
    .filter((value): value is SiteCategory =>
      (siteCategories as readonly string[]).includes(value),
    );
  const sort: Sort = params.get('sort') === 'pages' ? 'pages' : 'name';
  const view: View = params.get('view') === 'list' ? 'list' : 'grid';

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes))
      if (value) next.set(key, value);
      else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  // Typing updates the field at once and the URL a moment later.
  const [search, setSearch] = useState(q);
  const debouncing = search.trim() !== q;
  useEffect(() => {
    if (!debouncing) return;
    const timer = setTimeout(
      () => update({ q: search.trim() || undefined }),
      250,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const query = q.toLowerCase();
  const shown = sites
    .filter(
      (site) =>
        (categories.length === 0 || categories.includes(site.category)) &&
        (!query ||
          `${site.name} ${site.slug} ${site.tagline}`
            .toLowerCase()
            .includes(query)),
    )
    .sort((a, b) =>
      sort === 'pages'
        ? b.pageCount - a.pageCount || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  const filtered = categories.length > 0 || query !== '';
  const setCategories = (next: SiteCategory[]) =>
    update({ category: next.length > 0 ? next.join(',') : undefined });

  return (
    <>
      {/* Dashboard header: title on the left, toolbar on the right. */}
      <header className="sticky top-16 z-30 bg-[var(--ui-bg)]/85 backdrop-blur-xl md:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-8">
          <div>
            <h1 className="sc-ui-typography sc-ui-h1 text-[var(--ui-primary)]">
              Your sites
            </h1>
            <p className="m-0 mt-1 text-sm text-[var(--ui-muted)]">
              {sites.length} sites share one component library. Choose one to
              edit its pages.
            </p>
          </div>

          <div className="relative flex w-full items-center gap-3 sm:w-auto">
            {/* Search widens while it has focus, like the AFL dashboards. */}
            <motion.div
              role="search"
              animate={{ width: focused ? 360 : 260 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative max-w-full min-w-0 flex-1 sm:flex-none"
            >
              <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-[var(--ui-faint)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search sites"
                aria-label="Search sites"
                className={`sc-ui-input transition-shadow ${focused ? 'shadow-lg ring-2 ring-[var(--ui-primary)]/20' : ''}`}
                // Inline: the UI library's input padding outranks utilities.
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
              />
              <AnimatePresence mode="wait">
                {debouncing ? (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                  >
                    <Loader2 className="size-4 animate-spin text-[var(--ui-primary)]" />
                  </motion.span>
                ) : search ? (
                  <motion.button
                    key="clear"
                    type="button"
                    aria-label="Clear search"
                    initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => {
                      setSearch('');
                      update({ q: undefined });
                    }}
                    className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[var(--ui-muted)] hover:bg-[var(--ui-bg-secondary)] hover:text-[var(--ui-fg)]"
                  >
                    <X className="size-4" />
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </motion.div>

            {/* Actions fade back while searching, so the field has room. */}
            <motion.div
              animate={{ opacity: focused ? 0.4 : 1 }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--ui-glass)] p-1"
            >
              <span className="relative">
                <IconButton
                  label="Filter and sort"
                  variant={filterOpen ? 'primary' : 'ghost'}
                  onClick={() => setFilterOpen(true)}
                >
                  <SlidersHorizontal className="size-4" />
                </IconButton>
                {categories.length > 0 && (
                  <span className="pointer-events-none absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[var(--ui-primary)] text-[10px] font-bold text-white shadow-sm">
                    {categories.length}
                  </span>
                )}
              </span>
              <IconButton
                label={view === 'grid' ? 'Show as a list' : 'Show as cards'}
                variant="ghost"
                onClick={() =>
                  update({ view: view === 'grid' ? 'list' : undefined })
                }
              >
                {view === 'grid' ? (
                  <List className="size-4" />
                ) : (
                  <LayoutGrid className="size-4" />
                )}
              </IconButton>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-2 pb-16 sm:px-8">
        {/* Results line, as on the AFL Teams page. */}
        <div className="flex items-center justify-between gap-4">
          <p className="m-0 text-sm font-medium text-[var(--ui-muted)]">
            Showing{' '}
            <span className="font-bold text-[var(--ui-fg)]">
              {shown.length}
            </span>{' '}
            of {sites.length} sites
            {categories.length > 0 && (
              <span className="ml-2 text-[var(--ui-primary)]">
                (
                {categories
                  .map((category) => siteCategoryLabels[category])
                  .join(', ')}
                )
              </span>
            )}
          </p>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                update({ q: undefined, category: undefined });
              }}
              className="text-xs font-semibold text-[var(--ui-primary)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {sites.length === 0 ? (
          <Empty>
            No sites yet. Run <code>npm run seed</code> to create the sample
            sites.
          </Empty>
        ) : shown.length === 0 ? (
          <Empty>No sites match{q ? ` “${q}”` : ' these filters'}.</Empty>
        ) : view === 'list' ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {shown.map((site) => (
              <SiteRow key={site.id} site={site} />
            ))}
          </ul>
        ) : sort === 'pages' ? (
          // Sorted by size: one grid, so the order reads straight across.
          <CardGrid sites={shown} large={filtered} />
        ) : (
          siteCategories.map((category) => {
            const group = shown.filter((site) => site.category === category);
            if (group.length === 0) return null;
            return (
              <section key={category} className="flex flex-col gap-2">
                <span className="sc-ui-overline">
                  {siteCategoryLabels[category]} · {group.length}
                </span>
                <CardGrid sites={group} large={filtered} />
              </section>
            );
          })
        )}
      </div>

      <Drawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filter & Sort"
        className="flex flex-col gap-6"
      >
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="sc-ui-overline mb-3">Kind of site</legend>
          {siteCategories.map((category) => (
            <Checkbox
              key={category}
              label={`${siteCategoryLabels[category]} (${sites.filter((site) => site.category === category).length})`}
              checked={categories.includes(category)}
              onChange={(event) =>
                setCategories(
                  event.target.checked
                    ? [...categories, category]
                    : categories.filter((value) => value !== category),
                )
              }
            />
          ))}
        </fieldset>
        <div className="flex flex-col gap-3">
          <span className="sc-ui-overline">Sort by</span>
          <SegmentedControl
            ariaLabel="Sort by"
            value={sort}
            onValueChange={(value) =>
              update({ sort: value === 'pages' ? 'pages' : undefined })
            }
            options={[
              { value: 'name', label: 'Name' },
              { value: 'pages', label: 'Most pages' },
            ]}
          />
        </div>
        <div className="mt-auto flex justify-between gap-3">
          <button
            type="button"
            className="sc-ui-button"
            data-variant="secondary"
            onClick={() => update({ category: undefined, sort: undefined })}
          >
            Reset
          </button>
          <button
            type="button"
            className="sc-ui-button"
            onClick={() => setFilterOpen(false)}
          >
            Show {shown.length} sites
          </button>
        </div>
      </Drawer>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="sc-ui-card m-0 text-center text-sm text-[var(--ui-muted)]">
      {children}
    </p>
  );
}

/**
 * The full list packs smaller cards (up to three across); a filtered or
 * searched list has fewer sites, so its cards are larger (two across).
 */
function CardGrid({ sites, large }: { sites: SiteSummary[]; large: boolean }) {
  return (
    // Room above each row: every card's logo rises out of its top.
    <div
      className={`mt-14 grid gap-x-6 gap-y-16 ${large ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}
    >
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} large={large} />
      ))}
    </div>
  );
}

/**
 * The card's paint. The tab and the notch are solid brand colour, so the
 * body stays that exact colour along its top edge (the first 28px) and only
 * then deepens downwards; a soft light rises from the bottom-right corner,
 * well away from the joins. Nothing changes where the pieces meet.
 */
function cardPaint({ brand, brandContrast }: SiteSummary['colors']) {
  return {
    '--sc-notch-bg': brand,
    '--sc-notch-fg': brandContrast,
    '--sc-notch-body-bg': [
      `radial-gradient(90% 70% at 100% 100%, color-mix(in oklch, ${brand}, white 22%), transparent 70%)`,
      `linear-gradient(to bottom, ${brand} 0, ${brand} 28px, color-mix(in oklch, ${brand}, black 22%) 100%)`,
    ].join(', '),
  } as CSSProperties;
}

/**
 * One site in its own colours: a notch card painted with the site's brand,
 * its logo rising out of the top right. The whole card opens the site's
 * pages; "View site" opens the public site.
 */
function SiteCard({ site, large }: { site: SiteSummary; large: boolean }) {
  return (
    <NotchCard
      title={site.name}
      className="group relative h-full transition-transform duration-300 hover:scale-[1.02]"
      style={cardPaint(site.colors)}
    >
      <div className={`flex h-full ${large ? 'min-h-36' : 'min-h-28'}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
          {/* Clear of the logo, which reaches into the card's top right. */}
          <p
            className={`m-0 line-clamp-3 leading-relaxed opacity-85 ${large ? 'pr-48 text-base' : 'pr-28 text-sm'}`}
          >
            {site.tagline}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-current/15 px-2.5 py-1">
              <FileText aria-hidden className="size-3.5" />
              {site.pageCount} {site.pageCount === 1 ? 'page' : 'pages'}
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
      </div>
      {/* The logo rises out of the card beside the tab, its foot 22px into
          the card (the tab row is 30px tall). */}
      <span
        className="pointer-events-none absolute right-6 z-[2]"
        style={{ bottom: 'calc(100% - 52px)' }}
      >
        <CardLogo
          src={site.logoUrl}
          name={site.name}
          {...(large ? logoSizes.large : logoSizes.small)}
        />
      </span>
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

/** Logo sizes: the area every logo gets, and the box it must stay inside. */
const logoSizes = {
  small: { area: 76 * 76, maxWidth: 150, maxHeight: 76 },
  large: { area: 100 * 100, maxWidth: 200, maxHeight: 100 },
};

/**
 * A logo the same visual size as every other. Logos come in any shape,
 * from square badges to wide wordmarks; giving each the same height makes a
 * wordmark huge, and the same width makes a badge tiny. So each gets the
 * same area: its shape (read once it loads) sets the width and height,
 * capped by the box. It stays hidden until measured, so it never jumps.
 * Outlined in white like the site header's logo; it floats on card hover
 * (.logo-float in app/globals.css).
 */
function CardLogo({
  src,
  name,
  area,
  maxWidth,
  maxHeight,
}: {
  src?: string;
  name: string;
  area: number;
  maxWidth: number;
  maxHeight: number;
}) {
  const [aspect, setAspect] = useState<number>();
  const [failed, setFailed] = useState(false);
  const measure = (img: HTMLImageElement | null) => {
    // Already loaded before React attached (cached, or during hydration).
    if (img?.complete && img.naturalWidth && aspect === undefined)
      setAspect(img.naturalWidth / img.naturalHeight);
  };
  if (!src || failed) {
    const side = Math.sqrt(area) * 0.8;
    return (
      <span
        aria-hidden
        className="logo-float grid place-items-center rounded-2xl bg-white text-sm font-black text-black/80"
        style={{ width: side, height: side }}
      >
        {name
          .split(/\s+/)
          .map((word) => word[0])
          .join('')
          .slice(0, 3)
          .toUpperCase()}
      </span>
    );
  }
  const ratio = aspect ?? 1;
  const width = Math.sqrt(area * ratio);
  const height = Math.sqrt(area / ratio);
  const fit = Math.min(1, maxWidth / width, maxHeight / height);
  return (
    <span className="logo-float block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={measure}
        src={src}
        alt=""
        onLoad={(event) =>
          setAspect(
            event.currentTarget.naturalWidth /
              event.currentTarget.naturalHeight,
          )
        }
        onError={() => setFailed(true)}
        className="logo-outline block object-contain transition-opacity duration-300"
        style={{
          width: width * fit,
          height: height * fit,
          opacity: aspect === undefined ? 0 : 1,
        }}
      />
    </span>
  );
}

/** The list view: one compact row per site, still in its own colours. */
function SiteRow({ site }: { site: SiteSummary }) {
  return (
    <li className="group relative flex items-center gap-4 rounded-2xl bg-[var(--ui-surface)] p-3 pr-4 transition hover:shadow-[var(--ui-shadow-md)]">
      <span
        className="grid h-14 w-20 shrink-0 place-items-center rounded-xl"
        style={{ background: site.colors.brand }}
      >
        <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-bold">{site.name}</p>
        <p className="m-0 truncate text-xs text-[var(--ui-muted)]">
          {siteCategoryLabels[site.category]} · {site.tagline}
        </p>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-[var(--ui-muted)] sm:inline-flex">
        <FileText aria-hidden className="size-3.5" />
        {site.pageCount}
      </span>
      <a
        href={`/sites/${site.slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`View ${site.name}`}
        className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[var(--ui-muted)] hover:bg-[var(--ui-bg-secondary)] hover:text-[var(--ui-fg)]"
      >
        <ExternalLink className="size-4" />
      </a>
      <Link
        href={`/manager/${site.slug}`}
        aria-label={`Manage the pages of ${site.name}`}
        className="stretched-link"
      />
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-[var(--ui-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ui-primary)]"
      />
    </li>
  );
}
