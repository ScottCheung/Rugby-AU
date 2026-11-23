import type { CollectionId } from './collections';
import type { ThemeOverrides } from './theme/types';

/**
 * One node of a page tree: the portable part of a page. Plain JSON only
 * (no ObjectIds, no Dates) so it can be stored, exported and rendered by
 * anything that knows the component library.
 */
export type ComponentNode = {
  /** crypto.randomUUID(), stable while editing. */
  id: string;
  /** Must match a registered component, e.g. "section" or "cards". */
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
  /** Order of the top-level pages in the menu (page ids); home is always first. */
  menuOrder?: string[];
  /** A call to action at the end of the header, e.g. "Buy tickets". */
  headerButton?: { label: string; href: string };
  /** Extra links in the footer, e.g. social media. */
  footerLinks?: { label: string; href: string }[];
};

/** How a page appears in its site's menu. Both are optional. */
export type PageNav = {
  /** The menu's name for the page, when it should differ from the title. */
  label?: string;
  /** Leave the page out of the menu (it stays reachable by its address). */
  hidden?: boolean;
};

/** What an editor writes: a title, an optional description and the component tree. */
export type PageContent = {
  title: string;
  description?: string;
  /** Saved and published with the page, so a menu change goes live with it. */
  nav?: PageNav;
  components: ComponentNode[];
};

/** The content visitors see, and which publish produced it. */
export type PublishedContent = PageContent & {
  /** 1 for the first publish, then +1 each time. */
  version: number;
  /** ISO date string. */
  publishedAt: string;
};

/**
 * A page: where it lives (site + path) and two copies of its content.
 * The manager edits `draft`; the public site renders only `published`,
 * so a page that was never published is a 404 to visitors.
 */
export type Page = {
  id: string;
  siteSlug: string;
  /** "/" for home, otherwise "/about": leading slash, no trailing slash. */
  path: string;
  /**
   * Set on the one page that draws each entry of a collection (the news
   * article template). It has no address of its own: the public site
   * shows it at /news/<slug>.
   */
  template?: CollectionId;
  draft: PageContent;
  published: PublishedContent | null;
  /** When the draft was last saved (ISO). */
  updatedAt: string;
};

/** A past publish, kept in page_versions (see lib/db/versions.ts). */
export type PageVersion = PublishedContent & { pageId: string };

/** One link in a site's menu (its top-level pages). */
export type MenuItem = {
  id: string;
  path: string;
  /** What the menu shows: the page's menu label, else its title ("Home" for /). */
  title: string;
};
