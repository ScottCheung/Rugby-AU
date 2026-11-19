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

/** A site as the app uses it (the Mongo _id is exposed as a string id). */
export type Site = {
  id: string;
  slug: string;
  name: string;
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
