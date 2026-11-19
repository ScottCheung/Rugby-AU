import type { ObjectId } from 'mongodb';
import type { ThemeOverrides } from '../theme/types';
import type { ComponentNode } from '../types';

/** Shapes as stored in MongoDB. The rest of the app uses lib/types.ts. */
export type SiteDocument = {
  _id: ObjectId;
  slug: string;
  name: string;
  faviconUrl?: string;
  logoUrl?: string;
  theme: ThemeOverrides;
};

export type PageDocument = {
  _id: ObjectId;
  siteSlug: string;
  path: string;
  title: string;
  description?: string;
  tree: ComponentNode[];
  updatedAt: Date;
};

export const SITES = 'sites';
export const PAGES = 'pages';
