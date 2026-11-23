import type { ObjectId } from 'mongodb';
import type { ThemeOverrides } from '../theme/types';
import type { CollectionId } from '../collections';
import type { PageContent, SiteCategory } from '../types';

/** Shapes as stored in MongoDB. The rest of the app uses lib/types.ts. */
export type SiteDocument = {
  _id: ObjectId;
  slug: string;
  name: string;
  category: SiteCategory;
  tagline: string;
  faviconUrl?: string;
  logoUrl?: string;
  theme: ThemeOverrides;
  menuOrder?: string[];
  headerButton?: { label: string; href: string };
  footerLinks?: { label: string; href: string }[];
};

/** Page content as stored: like PageContent, with a real Date where needed. */
export type PublishedDocument = PageContent & {
  version: number;
  publishedAt: Date;
};

export type PageDocument = {
  _id: ObjectId;
  siteSlug: string;
  path: string;
  /** The page that draws every entry of this collection (see Page.template). */
  template?: CollectionId;
  draft: PageContent;
  published: PublishedDocument | null;
  updatedAt: Date;
};

/** One publish of one page. Unique on { pageId, version }. */
export type PageVersionDocument = PublishedDocument & {
  _id: ObjectId;
  pageId: ObjectId;
};

/** One news article or player: a site's own content, apart from its pages. */
export type EntryDocument = {
  _id: ObjectId;
  siteSlug: string;
  collection: CollectionId;
  slug: string;
  data: Record<string, unknown>;
  status: 'draft' | 'published';
  updatedAt: Date;
};

export const ENTRIES = 'entries';
export const SITES = 'sites';
export const PAGES = 'pages';
export const PAGE_VERSIONS = 'page_versions';
