import { describe, expect, it } from 'vitest';
import {
  collections,
  slugify,
  summarizeEntry,
  validateEntry,
  type Entry,
} from '../lib/collections';
import { pruneEntryRefs } from '../lib/collections/prune';
import { selectPlayers } from '../lib/collections/select';
import { cards } from '../lib/components/blocks/cards';
import { stats } from '../lib/components/blocks/stats';
import { fillMissing } from '../lib/components/placeholders';
import {
  articlesFromEntries,
  playersFromEntries,
  type PlayerSummary,
} from '../lib/collections/summaries';
import { selectArticles } from '../lib/collections/select';
import type { ComponentNode } from '../lib/types';

const image = { url: 'https://example.com/a.jpg', alt: 'A photo' };
const entry = (
  collection: Entry['collection'],
  slug: string,
  data: Record<string, unknown>,
  status: Entry['status'] = 'published',
): Entry => ({
  id: slug,
  siteSlug: 'demo',
  collection,
  slug,
  data,
  status,
  updatedAt: '2026-11-22T00:00:00.000Z',
});
const story = (headline: string, date: string) => ({
  category: 'News',
  date,
  headline,
  standfirst: 'A sentence.',
  image,
  body: [{ kind: 'paragraph', text: 'The story.' }],
});

describe('slugify', () => {
  it('makes an address from a title', () => {
    expect(slugify('Two home World Cups: what’s next?')).toBe(
      'two-home-world-cups-whats-next',
    );
    expect(slugify('Émile Ntamack')).toBe('emile-ntamack');
    expect(slugify('???')).toBe('entry');
  });
});

describe('validateEntry', () => {
  it('uses the collection’s own schema, with errors keyed by field', () => {
    const result = validateEntry('news', { ...story('', '2026-11-01') });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(['headline']);
    expect(validateEntry('players', { name: ' Sam ' })).toEqual({
      ok: true,
      data: { name: 'Sam' },
    });
  });

  it('starts every collection with data that is valid', () => {
    for (const definition of Object.values(collections))
      expect(validateEntry(definition.id, definition.blank()).ok).toBe(true);
  });
});

describe('summaries', () => {
  it('lists published news newest first, leaving out invalid entries', () => {
    const articles = articlesFromEntries([
      entry('news', 'old', story('Old', '2026-01-01')),
      entry('news', 'new', story('New', '2026-06-01')),
      entry('news', 'broken', { headline: 'No date' }),
      entry('players', 'someone', { name: 'Someone' }),
    ]);
    expect(articles.map((a) => [a.id, a.path])).toEqual([
      ['new', '/news/new'],
      ['old', '/news/old'],
    ]);
  });

  it('describes an entry for the editor', () => {
    expect(
      summarizeEntry(
        entry('players', 'sam', {
          name: 'Sam',
          role: 'Prop',
          group: 'Forwards',
        }),
      ),
    ).toMatchObject({
      title: 'Sam',
      detail: 'Prop · Forwards',
      group: 'Forwards',
    });
  });
});

const players: PlayerSummary[] = playersFromEntries(
  ['a', 'b', 'c', 'd'].map((slug, index) =>
    entry('players', slug, {
      name: slug.toUpperCase(),
      group: index < 2 ? 'Forwards' : 'Backs',
    }),
  ),
);

describe('selectPlayers', () => {
  const names = (list: ReturnType<typeof selectPlayers>) =>
    list.map(({ player }) => player.id);

  it('shows a group, or everyone', () => {
    expect(names(selectPlayers(players, { group: 'Backs' }))).toEqual([
      'c',
      'd',
    ]);
    expect(names(selectPlayers(players, {}))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('shows exactly the picked ones, in the order picked', () => {
    expect(
      names(selectPlayers(players, { picked: ['d', 'a', 'gone'] })),
    ).toEqual(['d', 'a']);
  });

  it('leaves hidden ones out for visitors and ghosts them in the editor', () => {
    expect(names(selectPlayers(players, { hidden: ['b'] }))).toEqual([
      'a',
      'c',
      'd',
    ]);
    expect(
      selectPlayers(players, { hidden: ['b'], editing: true }).map((m) => [
        m.player.id,
        m.hidden,
      ]),
    ).toEqual([
      ['a', false],
      ['b', true],
      ['c', false],
      ['d', false],
    ]);
  });

  it('does not count hidden players towards the limit', () => {
    expect(names(selectPlayers(players, { hidden: ['a'], limit: 2 }))).toEqual([
      'b',
      'c',
    ]);
  });
});

describe('selectArticles picked', () => {
  const articles = articlesFromEntries([
    entry('news', 'x', story('X', '2026-03-01')),
    entry('news', 'y', story('Y', '2026-02-01')),
    entry('news', 'z', story('Z', '2026-01-01')),
  ]);
  it('shows exactly the picked ones, in order, ignoring the limit', () => {
    expect(
      selectArticles(articles, { limit: 1, picked: ['z', 'x'] }).map(
        (a) => a.id,
      ),
    ).toEqual(['z', 'x']);
  });
});

describe('pruneEntryRefs', () => {
  it('drops hidden and picked slugs of entries that no longer exist', () => {
    const tree: ComponentNode[] = [
      {
        id: 's',
        type: 'section',
        props: {},
        children: [
          {
            id: 'b',
            type: 'people',
            props: {
              content: {
                from: 'players',
                mode: 'pick',
                picked: ['a', 'gone'],
                hidden: ['gone'],
              },
            },
          },
        ],
      },
    ];
    const [pruned] = pruneEntryRefs(tree, {
      news: new Set(),
      players: new Set(['a']),
    });
    expect(pruned.children?.[0].props.content).toEqual({
      from: 'players',
      mode: 'pick',
      picked: ['a'],
    });
  });
});

describe('placeholders for missing fields', () => {
  it('fills what a block type needs and an item lacks, naming it', () => {
    const { item, missing } = fillMissing({ title: 'Titles' }, stats.roles);
    expect(missing).toEqual(['Number']);
    expect(item.value).toBe('Missing number');
    expect(fillMissing({ title: 'x' }, cards.roles).missing).toEqual(['Image']);
    const filled = fillMissing({ title: 'x' }, cards.roles).item.image;
    expect(filled?.url.startsWith('data:image/svg+xml')).toBe(true);
    // Nothing missing: the item is returned as it is.
    const complete = { value: '2', title: 'Titles' };
    expect(fillMissing(complete, stats.roles).item).toBe(complete);
  });
});
