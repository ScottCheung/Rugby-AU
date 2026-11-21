import type { ObjectId } from 'mongodb';
import type { ThemeOverrides } from '../theme/types';
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
  draft: PageContent;
  published: PublishedDocument | null;
  updatedAt: Date;
};

/** One publish of one page. Unique on { pageId, version }. */
export type PageVersionDocument = PublishedDocument & {
  _id: ObjectId;
  pageId: ObjectId;
};

export const SITES = 'sites';
export const PAGES = 'pages';
export const PAGE_VERSIONS = 'page_versions';
