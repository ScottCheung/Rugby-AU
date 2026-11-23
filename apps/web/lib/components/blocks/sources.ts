import { z } from 'zod';
import {
  articleCategories,
  collectionIds,
  collections,
  type CollectionId,
} from '../../collections';
import { selectPlayers } from '../../collections/select';
import { selectFixturesMarked } from '../../fixtures/select';
import { australianTeamIds, australianTeams } from '../../fixtures/teams';
import { type SiteData } from './siteData';
import {
  formatDate,
  selectArticles,
  selectArticlesForEditor,
} from '../../collections/select';
import '../editorMeta';
import type { Layout } from './layout';
import { isStoryField, storyFromText } from '../story';
import {
  editableRoles,
  imageRoles,
  type EditableRole,
  type Item,
  type Role,
  type Roles,
} from './roles';

/**
 * Where a block's items can come from besides being written by hand: the
 * site's news and players, the fixtures service, or (on an article
 * template) the article being shown.
 *
 * Everything about a source is here, so nothing else in the app names
 * one: which roles it fills in (a block can use it when it fills every
 * role the block requires: a rule, not a list), its options, how it turns
 * its records into items, how a block of it is named, where its records
 * are edited and the ready-made block "Add a block" offers. What it loads
 * on the server is in lib/render/sourceData.ts, kept apart so this file
 * stays safe for the browser.
 */
export type SourceDefinition = {
  id: SourceId;
  label: string;
  /** What one of its items is called: "Article", "Match". */
  itemLabel: string;
  provides: readonly Role[];
  /** Its options, after `from`. A function: some depend on the block's roles. */
  query: (roles: Roles) => Record<string, z.ZodType>;
  /** A new block's options. */
  defaults: Record<string, unknown>;
  /**
   * The items to draw, each with its id. Visitors get the visible ones;
   * the editor gets the hidden ones too, marked, so they can be shown
   * again. Pure, so the page and the editor always agree.
   */
  items: (
    query: Record<string, unknown>,
    data: SiteData,
    editing: boolean,
  ) => { ref: string; item: Item; hidden: boolean }[];
  /** A block of it, as Layers names it: "News · latest 3". */
  summary: (query: Record<string, unknown>) => string;
  /**
   * Its records are the site's entries of this collection: an item opens
   * that entry's form, and a block can choose them by hand.
   */
  collection?: CollectionId;
  /** What can be chosen by hand, when `mode` is "pick". */
  pool?: (data: SiteData) => { id: string; label: string }[];
  /** Only on an article template: the record the page is showing. */
  templateOnly?: true;
  /** Said about one of its items, when it cannot be edited anywhere. */
  readOnlyNote?: string;
  /** The ready-made block "Add a block" offers under the site's content. */
  starter?: {
    type: string;
    label: string;
    description: string;
    layout?: Layout;
  };
};

export const sourceIds = ['news', 'players', 'fixtures', 'entry'] as const;
export type SourceId = (typeof sourceIds)[number];

/** Ids an editor hides or picks with the eye toggle and the picker. */
const refList = (label: string) =>
  z.array(z.string()).optional().meta({ label, managed: true });

const which = z
  .enum(['latest', 'pick'])
  .default('latest')
  .meta({
    label: 'Which',
    optionLabels: { latest: 'The latest', pick: 'Chosen by hand' },
  });

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);
const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string') : undefined;
const num = (value: unknown, fallback: number) =>
  typeof value === 'number' ? value : fallback;
const picked = (query: Record<string, unknown>, label: string) =>
  query.mode === 'pick'
    ? `${label} · ${strings(query.picked)?.length ?? 0} chosen`
    : undefined;

const news: SourceDefinition = {
  id: 'news',
  label: 'News',
  itemLabel: 'Article',
  provides: ['title', 'text', 'image', 'link', 'eyebrow'],
  collection: 'news',
  query: () => ({
    mode: which,
    category: z
      .enum(articleCategories)
      .optional()
      .meta({ label: 'Only this category', showIf: { mode: 'latest' } }),
    limit: z
      .number()
      .int()
      .min(1, 'Show at least one')
      .max(12, 'Show at most 12')
      .meta({ label: 'At most', showIf: { mode: 'latest' } }),
    picked: refList('Chosen articles'),
    hidden: refList('Hidden articles'),
  }),
  defaults: { mode: 'latest', limit: 3 },
  items: (query, data, editing) => {
    const options = {
      category: str(query.category),
      limit: num(query.limit, 3),
      hidden: strings(query.hidden),
      picked: query.mode === 'pick' ? strings(query.picked) : undefined,
      // "More news" under an article never repeats it.
      exclude: data.pagePath,
    };
    const chosen = editing
      ? selectArticlesForEditor(data.articles, options)
      : selectArticles(data.articles, options).map((article) => ({
          article,
          hidden: false,
        }));
    return chosen.map(({ article, hidden }) => ({
      ref: article.id,
      hidden,
      item: {
        title: article.headline,
        text: article.standfirst,
        image: article.image,
        link: { label: 'Read more', href: article.path },
        eyebrow: `${article.category} · ${formatDate(article.date)}`,
      },
    }));
  },
  summary: (query) =>
    picked(query, 'News') ?? `News · latest ${num(query.limit, 3)}`,
  pool: (data) =>
    data.articles.map((article) => ({
      id: article.id,
      label: article.headline,
    })),
  starter: {
    type: 'cards',
    label: 'News',
    description: "The site's latest articles as cards.",
    layout: { arrange: 'featured' },
  },
};

const players: SourceDefinition = {
  id: 'players',
  label: 'Players',
  itemLabel: 'Player',
  provides: ['title', 'subtitle', 'text', 'cutout', 'background', 'link'],
  collection: 'players',
  query: () => ({
    mode: which,
    group: z
      .string()
      .trim()
      .optional()
      .meta({ label: 'Only this group', showIf: { mode: 'latest' } }),
    limit: z
      .number()
      .int()
      .min(1)
      .max(60)
      .optional()
      .meta({ label: 'At most', showIf: { mode: 'latest' } }),
    picked: refList('Chosen players'),
    hidden: refList('Hidden players'),
  }),
  defaults: { mode: 'latest', limit: 8 },
  items: (query, data, editing) =>
    selectPlayers(data.players, {
      picked: query.mode === 'pick' ? strings(query.picked) : undefined,
      group: str(query.group),
      hidden: strings(query.hidden),
      limit: typeof query.limit === 'number' ? query.limit : undefined,
      editing,
    }).map(({ player, hidden }) => ({
      ref: player.id,
      hidden,
      item: {
        title: player.name,
        subtitle: player.role,
        text: player.text,
        cutout: player.cutout,
        background: player.background,
        link: player.link,
      },
    })),
  summary: (query) =>
    picked(query, 'Players') ??
    (str(query.group) ? `Players · ${query.group}` : 'Players'),
  pool: (data) =>
    data.players.map((player) => ({ id: player.id, label: player.name })),
  starter: {
    type: 'people',
    label: 'Players',
    description: "The site's players as person cards.",
    layout: { arrange: 'carousel' },
  },
};

const fixtures: SourceDefinition = {
  id: 'fixtures',
  label: 'Fixtures',
  itemLabel: 'Match',
  provides: ['title', 'match'],
  query: () => ({
    team: z
      .enum(australianTeamIds)
      .optional()
      .meta({ label: 'Team', optionLabels: australianTeams }),
    show: z.enum(['upcoming', 'results', 'both']).meta({
      label: 'Show',
      optionLabels: { upcoming: 'Upcoming', results: 'Results', both: 'Both' },
    }),
    limit: z.number().int().min(1).max(12).meta({ label: 'At most' }),
    hidden: refList('Hidden matches'),
  }),
  defaults: { show: 'both', limit: 4 },
  items: (query, data, editing) => {
    const team = str(query.team);
    const marked = selectFixturesMarked(data.fixtures, {
      team,
      show: (str(query.show) ?? 'both') as 'upcoming' | 'results' | 'both',
      limit: num(query.limit, 4),
      hidden: strings(query.hidden),
    });
    // Upcoming first (soonest first), then results (newest first).
    return [...marked.upcoming, ...marked.results]
      .filter(({ hidden }) => editing || !hidden)
      .map(({ fixture, hidden }) => ({
        ref: fixture.id,
        hidden,
        item: {
          title: `${fixture.home.name} v ${fixture.away.name}`,
          // Won or lost is told from the block's team, if it follows one.
          match: { fixture, team },
        },
      }));
  },
  summary: (query) => {
    const team = str(query.team);
    return team
      ? `Matches · ${australianTeams[team as keyof typeof australianTeams] ?? team}`
      : 'Matches';
  },
  readOnlyNote:
    'This match comes from the fixtures service, so it cannot be edited here. You can hide it in this block.',
  starter: {
    type: 'matches',
    label: 'Fixtures',
    description: 'Upcoming matches and results, from the fixtures service.',
  },
};

/** The fields of every collection that has a page of its own, by kind. */
const templateFields = collectionIds
  .filter((id) => collections[id].hasPage)
  .flatMap((id) =>
    Object.entries(collections[id].schema.shape as Record<string, z.ZodType>),
  );
/** What kind of value a field or role holds: a picture, a story, words. */
type ValueKind = 'image' | 'story' | 'words';
const fieldKind = (field: z.ZodType): ValueKind =>
  field.meta()?.widget === 'image'
    ? 'image'
    : isStoryField(field)
      ? 'story'
      : 'words';
const roleKind = (role: EditableRole): ValueKind =>
  imageRoles.includes(role) ? 'image' : role === 'story' ? 'story' : 'words';
const fieldsOf = (kind: ValueKind) => [
  ...new Set(
    templateFields
      .filter(([, field]) => fieldKind(field) === kind)
      .map(([key]) => key),
  ),
];
const fieldLabels = Object.fromEntries(
  templateFields.map(([key, field]) => [key, field.meta()?.label ?? key]),
);

/**
 * An article template: the entry being shown. Each role the block uses is
 * bound to one of the entry's fields ("Heading ← Headline"), so the
 * template is made of the same blocks as any page.
 */
const entry: SourceDefinition = {
  id: 'entry',
  label: 'This article',
  itemLabel: 'Article',
  provides: [...editableRoles, 'eyebrow'],
  templateOnly: true,
  query: (roles) =>
    Object.fromEntries(
      editableRoles
        .filter(
          (role) =>
            roles[role] && role !== 'link' && fieldsOf(roleKind(role)).length,
        )
        .map((role) => [
          role,
          z
            .enum(fieldsOf(roleKind(role)) as [string, ...string[]])
            .optional()
            .meta({
              label: `${roles[role]!.label} from`,
              optionLabels: fieldLabels,
            }),
        ]),
    ),
  defaults: { title: 'headline', text: 'standfirst', image: 'image' },
  items: (query, data) => {
    const shown = data.entry;
    if (!shown) return [];
    const item: Item = {
      eyebrow: collections[shown.collection].detailOf(shown.data),
    };
    for (const role of editableRoles) {
      const field = str(query[role]);
      let value = field ? shown.data[field] : undefined;
      // A body stored before stories were made of pieces is plain text.
      if (role === 'story' && value !== undefined) value = storyFromText(value);
      if (value !== undefined) (item as Record<string, unknown>)[role] = value;
    }
    return [{ ref: shown.slug, hidden: false, item }];
  },
  summary: () => 'This article',
  readOnlyNote:
    'This is the article the page is showing. Articles are edited under the site’s News.',
};

export const sources: Record<SourceId, SourceDefinition> = {
  news,
  players,
  fixtures,
  entry,
};

/** The source a block's content names, or undefined for written items. */
export function sourceOf(from: unknown): SourceDefinition | undefined {
  return typeof from === 'string' && from in sources
    ? sources[from as SourceId]
    : undefined;
}

/** Whether a source fills in every role these roles require. */
export function sourceFits(source: SourceDefinition, roles: Roles): boolean {
  return (Object.entries(roles) as [Role, { required: boolean }][]).every(
    ([role, use]) => !use.required || source.provides.includes(role),
  );
}
