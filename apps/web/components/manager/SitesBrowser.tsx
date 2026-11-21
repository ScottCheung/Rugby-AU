'use client';

import {
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { NotchCard } from '@scottcheung/ui';
import {
  Checkbox,
  Drawer,
  IconButton,
  SegmentedControl,
} from '@scottcheung/ui/client';
import { SiteLogo } from '@/components/primitives/SiteLogo';
import {
  colourFamilies,
  colourFamilyIds,
  type ColourFamily,
} from '@/lib/theme/colourFamily';
import { useManagerView } from './ManagerView';
import { ScrollHeader } from './ScrollHeader';
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
  /** The site's whole palette (lib/theme/types.ts). */
  colors: {
    brand: string;
    brandContrast: string;
    background: string;
    surfaceLight: string;
    text: string;
    mutedText: string;
  };
  /** Which colour family its brand colour is in (lib/theme/colourFamily.ts). */
  colourFamily: ColourFamily;
  /** The shared look its theme follows (lib/theme/looks.ts), or Custom. */
  look: {
    /** A look id, or 'custom'. */
    id: string;
    name: string;
    description: string;
    /** CSS font stack of its headings, to show the look in its own type. */
    headingFont: string;
    headingFontLabel: string;
    uppercase: boolean;
    radius: string;
  };
};

type Sort = 'name' | 'pages';

/**
 * The site list with its toolbar: search and a Filter & Sort drawer (kind
 * of site, look, colour, sort). Filters live in the URL (?q, category,
 * look, colour, sort), so a filtered list can be shared and the sidebar can
 * link to a kind of site. Grid or list is the manager's global view,
 * chosen in the sidebar.
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
  // Several values per filter, comma separated: ?look=official,matchDay
  const many = (key: string) =>
    (params.get(key) ?? '').split(',').filter(Boolean);
  const lookIds = many('look');
  const colours = many('colour').filter((value): value is ColourFamily =>
    (colourFamilyIds as string[]).includes(value),
  );
  const sort: Sort = params.get('sort') === 'pages' ? 'pages' : 'name';
  const { view } = useManagerView();

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
  // Phones: half the toolbar is too narrow to type in, so the search
  // rests wider there (the filter button still fits beside it).
  const narrow = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia('(max-width: 639px)');
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false,
  );

  const query = q.toLowerCase();
  const shown = sites
    .filter(
      (site) =>
        (categories.length === 0 || categories.includes(site.category)) &&
        (lookIds.length === 0 || lookIds.includes(site.look.id)) &&
        (colours.length === 0 || colours.includes(site.colourFamily)) &&
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
  const filterCount = categories.length + lookIds.length + colours.length;
  const filtered = filterCount > 0 || query !== '';
  /** Add or remove one value of a multi-select filter. */
  const toggle = (key: string, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    update({ [key]: next.length > 0 ? next.join(',') : undefined });
  };
  // What the drawer offers: only the looks and colours the sites use.
  const lookOptions = [
    ...new Map(sites.map((site) => [site.look.id, site.look])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const colourOptions = colourFamilyIds.filter((family) =>
    sites.some((site) => site.colourFamily === family),
  );
  const count = (match: (site: SiteSummary) => boolean) =>
    sites.filter(match).length;
  const activeLabels = [
    ...categories.map((category) => siteCategoryLabels[category]),
    ...lookIds.map(
      (id) => lookOptions.find((look) => look.id === id)?.name ?? id,
    ),
    ...colours.map((family) => colourFamilies[family].label),
  ];

  return (
    <>
      <ScrollHeader
        title="Your sites"
        description={`${sites.length} sites share one component library. Choose one to edit its pages.`}
      >
        {/* The toolbar, after the AFL dashboards: the search takes half the
            row and, while focused, springs to the full width over the
            actions, which fade away until it is left. */}
        <div className="relative flex w-full items-center justify-end gap-4">
          <motion.div
            role="search"
            initial={false}
            animate={{ width: focused ? '100%' : narrow ? '78%' : '50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`absolute left-0 min-w-0 ${focused ? 'z-50' : 'z-10'}`}
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
                  initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.15 }}
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
                  exit={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  transition={{ duration: 0.15 }}
                  // Keeps focus in the field, so it stays wide while clearing.
                  onMouseDown={(event) => event.preventDefault()}
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

          {/* Actions: hidden while the search has the row. */}
          <motion.div
            animate={{ opacity: focused ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: focused ? 'none' : 'auto' }}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--ui-glass)] p-1"
          >
            <span className="relative">
              <IconButton
                label="Filter and sort"
                variant={filterOpen ? 'primary' : 'ghost'}
                onClick={() => setFilterOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
              </IconButton>
              {filterCount > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[var(--ui-primary)] text-[10px] font-bold text-white shadow-sm">
                  {filterCount}
                </span>
              )}
            </span>
          </motion.div>
        </div>
      </ScrollHeader>

      {/* Room for the toolbar, which starts under the title (ScrollHeader). */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-16 sm:px-8">
        {/* Results line, as on the AFL Teams page. */}
        <div className="flex items-center justify-between gap-4">
          <p className="m-0 text-sm font-medium text-[var(--ui-muted)]">
            Showing{' '}
            <span className="font-bold text-[var(--ui-fg)]">
              {shown.length}
            </span>{' '}
            of {sites.length} sites
            {activeLabels.length > 0 && (
              <span className="ml-2 text-[var(--ui-primary)]">
                ({activeLabels.join(', ')})
              </span>
            )}
          </p>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                update({
                  q: undefined,
                  category: undefined,
                  look: undefined,
                  colour: undefined,
                });
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
              onChange={() => toggle('category', categories, category)}
            />
          ))}
        </fieldset>

        {/* Looks, each shown in its own heading font and corners. */}
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="sc-ui-overline mb-3">Look</legend>
          <div className="flex flex-wrap gap-2">
            {lookOptions.map((look) => {
              const on = lookIds.includes(look.id);
              return (
                <button
                  key={look.id}
                  type="button"
                  aria-pressed={on}
                  title={look.description}
                  onClick={() => toggle('look', lookIds, look.id)}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    on
                      ? 'border-[var(--ui-primary)] bg-[var(--ui-primary-soft)] text-[var(--ui-primary)]'
                      : 'border-[var(--ui-border,rgb(0_0_0/0.1))] text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
                  }`}
                  style={{ borderRadius: `max(${look.radius}, 0.25rem)` }}
                >
                  <span
                    aria-hidden
                    className="font-bold"
                    style={{
                      fontFamily: look.headingFont,
                      textTransform: look.uppercase ? 'uppercase' : 'none',
                    }}
                  >
                    Aa
                  </span>
                  {look.name}
                  <span className="opacity-60">
                    {count((site) => site.look.id === look.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Colours: the brand colour's family. */}
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="sc-ui-overline mb-3">Brand colour</legend>
          <div className="flex flex-wrap gap-2">
            {colourOptions.map((family) => {
              const on = colours.includes(family);
              return (
                <button
                  key={family}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle('colour', colours, family)}
                  className={`inline-flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm font-semibold transition-colors ${
                    on
                      ? 'border-[var(--ui-primary)] bg-[var(--ui-primary-soft)] text-[var(--ui-primary)]'
                      : 'border-[var(--ui-border,rgb(0_0_0/0.1))] text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
                  }`}
                >
                  {/* The sites' own brand colours in this family. */}
                  <span className="flex -space-x-1.5">
                    {[
                      ...new Set(
                        sites
                          .filter((site) => site.colourFamily === family)
                          .map((site) => site.colors.brand),
                      ),
                    ]
                      .slice(0, 3)
                      .map((colour) => (
                        <span
                          key={colour}
                          className="size-5 rounded-full ring-2 ring-[var(--ui-surface)]"
                          style={{ background: colour }}
                        />
                      ))}
                  </span>
                  {colourFamilies[family].label}
                  <span className="opacity-60">
                    {count((site) => site.colourFamily === family)}
                  </span>
                </button>
              );
            })}
          </div>
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
            onClick={() =>
              update({
                category: undefined,
                look: undefined,
                colour: undefined,
                sort: undefined,
              })
            }
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
      <div className={`flex h-full ${large ? 'min-h-44' : 'min-h-40'}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
          {/* Clear of the logo, which reaches into the card's top right. */}
          <p
            className={`m-0 line-clamp-3 leading-relaxed opacity-85 ${large ? 'pr-48 text-base' : 'pr-28 text-sm'}`}
          >
            {site.tagline}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Palette colors={site.colors} />
            <LookChip look={site.look} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
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

/** The palette in the order a reader meets it: brand, then the page. */
const paletteRoles = [
  ['brand', 'Brand'],
  ['brandContrast', 'On brand'],
  ['background', 'Page'],
  ['surfaceLight', 'Light surface'],
  ['text', 'Text'],
  ['mutedText', 'Muted text'],
] as const;

/**
 * The site's palette as overlapping swatches. Each is ringed in the
 * current text colour, so a swatch the same colour as the card (the brand
 * one) still shows. Hovering one names it and gives its value.
 */
function Palette({ colors }: { colors: SiteSummary['colors'] }) {
  return (
    <span
      role="img"
      aria-label={`Palette: ${paletteRoles.map(([key, label]) => `${label} ${colors[key]}`).join(', ')}`}
      className="relative z-10 flex -space-x-1.5"
    >
      {paletteRoles.map(([key, label]) => (
        <span
          key={key}
          title={`${label} ${colors[key]}`}
          className="size-5 rounded-full shadow-sm ring-2 ring-current/35 transition-transform hover:z-10 hover:-translate-y-0.5"
          style={{ background: colors[key] }}
        />
      ))}
    </span>
  );
}

/**
 * The site's look, shown in itself: "Aa" in its heading font (in capitals
 * when the look uses them) and the chip's corners rounded as the look's.
 */
function LookChip({ look }: { look: SiteSummary['look'] }) {
  return (
    <span
      title={`${look.description} Headings: ${look.headingFontLabel}. Corners: ${look.radius === '0' ? 'square' : look.radius}.`}
      className="relative z-10 inline-flex items-center gap-2 border border-current/25 bg-current/10 py-1 pr-2.5 pl-1.5 text-xs font-semibold"
      // At least a hint of rounding, so a square look still reads as a chip.
      style={{ borderRadius: `max(${look.radius}, 0.2rem)` }}
    >
      <span
        aria-hidden
        className="grid min-w-6 place-items-center text-sm leading-none font-bold"
        style={{
          fontFamily: look.headingFont,
          textTransform: look.uppercase ? 'uppercase' : 'none',
        }}
      >
        Aa
      </span>
      <span>
        {look.name}
        <span className="opacity-60"> · {look.headingFontLabel}</span>
      </span>
    </span>
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
        className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl px-1.5 [&_img]:max-w-full! [&>span]:max-w-full!"
        style={{ background: site.colors.brand }}
      >
        <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-bold">{site.name}</p>
        <p className="m-0 truncate text-xs text-[var(--ui-muted)]">
          {siteCategoryLabels[site.category]} · {site.look.name} look ·{' '}
          {site.tagline}
        </p>
      </div>
      <span className="hidden shrink-0 md:block">
        <Palette colors={site.colors} />
      </span>
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
