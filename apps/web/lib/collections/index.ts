import { z } from 'zod';
import { articleCategories, articleSchema } from './article';
import { imageSchema, linkSchema } from '../components/fields';

/**
 * A site's own content, kept apart from its pages: news and players.
 * Each entry is written once in a form; columns on pages only choose which
 * entries to show and how. News entries also have a page of their own
 * (/news/<slug>), drawn by the site's news template page.
 */

export const collectionIds = ['news', 'players'] as const;
export type CollectionId = (typeof collectionIds)[number];

export const isCollection = (value: string): value is CollectionId =>
  (collectionIds as readonly string[]).includes(value);

export const playerSchema = z.object({
  name: z.string().trim().min(1, 'Add a name').meta({ label: 'Name' }),
  role: z
    .string()
    .trim()
    .min(1, 'Add a position, or remove it')
    .optional()
    .meta({ label: 'Role or position', placeholder: 'Fly-half' }),
  group: z.string().trim().optional().meta({
    label: 'Group',
    hint: 'Used to list players together, e.g. Forwards or Backs.',
  }),
  text: z
    .string()
    .trim()
    .min(1, 'Add some text or remove it')
    .optional()
    .meta({ label: 'Text', multiline: true }),
  cutout: imageSchema.optional().meta({
    label: 'Cut-out photo',
    hint: 'A PNG or WebP with a transparent background. The person can rise above the top of the card.',
    widget: 'image',
  }),
  background: imageSchema.optional().meta({
    label: 'Background',
    hint: 'The card colour is taken from the bottom of this photo automatically.',
    widget: 'image',
  }),
  link: linkSchema.optional(),
});
export type Player = z.infer<typeof playerSchema>;
export type Article = z.infer<typeof articleSchema>;

export type CollectionDefinition = {
  id: CollectionId;
  label: string;
  /** One entry: "Article", "Player". */
  itemLabel: string;
  schema: z.ZodObject;
  /** Entries have a page at /<id>/<slug>, drawn by the site's template. */
  hasPage: boolean;
  /** What an entry is called in lists. */
  titleOf: (data: Record<string, unknown>) => string;
  /** A line under it in lists. */
  detailOf: (data: Record<string, unknown>) => string;
  /** A sentence about it, for search results (entries with a page). */
  summaryOf?: (data: Record<string, unknown>) => string;
  /** A new entry's starting data. */
  blank: () => Record<string, unknown>;
};

const text = (value: unknown) => (typeof value === 'string' ? value : '');

export const collections: Record<CollectionId, CollectionDefinition> = {
  news: {
    id: 'news',
    label: 'News',
    itemLabel: 'Article',
    schema: articleSchema,
    hasPage: true,
    titleOf: (data) => text(data.headline) || 'Untitled article',
    summaryOf: (data) => text(data.standfirst),
    detailOf: (data) =>
      [text(data.category), text(data.date)].filter(Boolean).join(' · '),
    blank: () => ({
      category: articleCategories[0],
      date: new Date().toISOString().slice(0, 10),
      headline: 'Untitled article',
      standfirst: 'One or two sentences that sum up the story.',
      image: {
        url: 'https://images.unsplash.com/photo-1529663297269-6d349ec39b57?auto=format&fit=crop&w=1600&q=80',
        alt: 'Rugby goal posts in a full stadium',
      },
      body: [{ kind: 'paragraph', text: 'Write the story here.' }],
    }),
  },
  players: {
    id: 'players',
    label: 'Players',
    itemLabel: 'Player',
    schema: playerSchema,
    hasPage: false,
    titleOf: (data) => text(data.name) || 'Unnamed player',
    detailOf: (data) =>
      [text(data.role), text(data.group)].filter(Boolean).join(' · '),
    blank: () => ({ name: 'New player' }),
  },
};

/** An entry as the app uses it. */
export type Entry = {
  id: string;
  siteSlug: string;
  collection: CollectionId;
  /** Its address inside the collection; also its id in hidden/picked lists. */
  slug: string;
  data: Record<string, unknown>;
  status: 'draft' | 'published';
  updatedAt: string;
};

/** "Two home World Cups: what’s next" -> "two-home-world-cups-whats-next". */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || 'entry';
}

/** Validate an entry's data with its collection's schema. */
export function validateEntry(
  collection: CollectionId,
  data: unknown,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> } {
  const parsed = collections[collection].schema.safeParse(data);
  if (parsed.success)
    return { ok: true, data: parsed.data as Record<string, unknown> };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues)
    errors[issue.path.join('.')] ??=
      issue.code === 'invalid_type' && issue.input === undefined
        ? 'This field is required.'
        : issue.message;
  return { ok: false, errors };
}

/** An entry as the editor lists it (to pick, hide or open it). */
export type EntrySummary = {
  collection: CollectionId;
  slug: string;
  title: string;
  detail: string;
  status: Entry['status'];
  /** Players: the group they are listed under. */
  group?: string;
  /** News: the category. */
  category?: string;
};

export function summarizeEntry(entry: Entry): EntrySummary {
  const definition = collections[entry.collection];
  const group = entry.data.group;
  const category = entry.data.category;
  return {
    collection: entry.collection,
    slug: entry.slug,
    title: definition.titleOf(entry.data),
    detail: definition.detailOf(entry.data),
    status: entry.status,
    ...(typeof group === 'string' && group ? { group } : {}),
    ...(typeof category === 'string' && category ? { category } : {}),
  };
}
export { articleCategories, articleSchema } from './article';
