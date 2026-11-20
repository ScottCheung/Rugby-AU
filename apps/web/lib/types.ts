import type { ThemeOverrides } from './theme/types';

/**
 * One node of a page tree: the portable part of a page. Plain JSON only
 * (no ObjectIds, no Dates) so it can be stored, exported and rendered by
 * anything that knows the component library.
 */
export type ComponentNode = {
  /** crypto.randomUUID(), stable while editing. */
  id: string;
  /** Must match a registered component, e.g. "section" or "cardGrid". */
  type: string;
  props: Record<string, unknown>;
  /** Only for components that accept children. */
  children?: ComponentNode[];
};

/** Groups sites in the manager; with dozens of sites a flat list stops working. */
export const siteCategories = [
  'governing-body',
  'national-team',
  'super-rugby',
  'state-union',
] as const;
export type SiteCategory = (typeof siteCategories)[number];

export const siteCategoryLabels: Record<SiteCategory, string> = {
  'governing-body': 'Governing body',
  'national-team': 'National teams',
  'super-rugby': 'Super Rugby clubs',
  'state-union': 'State and territory unions',
};

/** A site as the app uses it (the Mongo _id is exposed as a string id). */
export type Site = {
  id: string;
  slug: string;
  name: string;
  category: SiteCategory;
  /** One line about the site, shown in the manager and the site footer. */
  tagline: string;
  faviconUrl?: string;
  logoUrl?: string;
  /** Only the tokens this site changes; see lib/theme/resolveTheme.ts. */
  theme: ThemeOverrides;
};

export type Page = {
  id: string;
  siteSlug: string;
  /** "/" for home, otherwise "/about": leading slash, no trailing slash. */
  path: string;
  title: string;
  description?: string;
  tree: ComponentNode[];
  /** ISO date string. */
  updatedAt: string;
};
