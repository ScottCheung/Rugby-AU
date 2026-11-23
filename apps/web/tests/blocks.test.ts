import { describe, expect, it } from 'vitest';
import type { BlockDefinition } from '../lib/components/blocks/defineBlock';
import { blockItems } from '../lib/components/blocks/resolve';
import { sources } from '../lib/components/blocks/sources';
import { createNode } from '../lib/components/createNode';
import { blockDefinitions, getBlock } from '../lib/components/registry';
import { starters } from '../lib/components/starters';
import { validateTree } from '../lib/components/validateTree';
import type { SiteData } from '../lib/components/blocks/siteData';

const image = { url: 'https://example.com/a.jpg', alt: 'A photo' };
const data: SiteData = {
  articles: [
    {
      id: 'a',
      path: '/news/a',
      category: 'History',
      date: '2026-11-03',
      headline: 'Story A',
      standfirst: 'In short.',
      image,
    },
    {
      id: 'b',
      path: '/news/b',
      category: 'News',
      date: '2026-11-02',
      headline: 'Story B',
      standfirst: 'In short.',
      image,
    },
  ],
  players: [],
  pagePath: '/',
  colors: {},
  fixtures: [],
  now: '2026-11-22T00:00:00.000Z',
};
const block = (type: string) => getBlock(type) as BlockDefinition;

describe('block types', () => {
  it('pair with data sources by a rule: a source must fill what the block needs', () => {
    expect(
      Object.fromEntries(
        blockDefinitions.map((definition) => [
          definition.type,
          [definition.writable, ...(definition as BlockDefinition).sources],
        ]),
      ),
    ).toEqual({
      // A text needs only text: news standfirsts can be one.
      text: [true, 'news', 'players', 'entry'],
      // A story is pieces: only an article's body is one.
      story: [true, 'entry'],
      hero: [true, 'news', 'entry'],
      cards: [true, 'news', 'entry'],
      photos: [true, 'news', 'entry'],
      stats: [true, 'entry'],
      people: [true, 'news', 'players', 'fixtures', 'entry'],
      matches: [false, 'fixtures'],
    });
  });

  it('every way to start a block gives a valid block', () => {
    for (const starter of starters) {
      const node = starter.create();
      const page =
        node.type === 'section'
          ? [node]
          : [{ ...createNode('section'), children: [node] }];
      const result = validateTree(page);
      expect(result.ok ? [] : result.issues, starter.id).toEqual([]);
    }
  });
});

describe('blockItems', () => {
  it('draws written items, leaving hidden ones to the editor', () => {
    const props = {
      content: {
        from: 'items',
        items: [
          { title: 'Shown', image },
          { title: 'Hidden', image, hidden: true },
        ],
      },
      layout: { arrange: 'grid' as const },
      style: {},
    };
    expect(
      blockItems(block('cards'), props, data, false).map(
        (one) => one.item.title,
      ),
    ).toEqual(['Shown']);
    expect(
      blockItems(block('cards'), props, data, true).map((one) => [
        one.ref,
        one.hidden,
      ]),
    ).toEqual([
      [{ field: 'items', index: 0 }, false],
      [{ field: 'items', index: 1 }, true],
    ]);
  });

  it('fills what a block needs and a written item lacks, in the editor only', () => {
    const props = {
      content: { from: 'items', items: [{ title: 'No photo' }] },
      layout: { arrange: 'grid' as const },
      style: {},
    };
    const [drawn] = blockItems(block('cards'), props, data, true);
    expect(drawn.item.image?.url.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('turns a source’s records into items with the shared roles', () => {
    const props = {
      content: { from: 'news', mode: 'latest', limit: 1 },
      layout: { arrange: 'grid' as const },
      style: {},
    };
    expect(blockItems(block('cards'), props, data, false)).toEqual([
      {
        key: 'ra',
        ref: { field: 'source', ref: 'a' },
        hidden: false,
        item: {
          title: 'Story A',
          text: 'In short.',
          image,
          link: { label: 'Read more', href: '/news/a' },
          eyebrow: 'History · 3 November 2026',
        },
      },
    ]);
  });

  it('binds the article being shown to the roles the block reads', () => {
    const items = sources.entry.items(
      { from: 'entry', title: 'headline', story: 'body' },
      {
        ...data,
        entry: {
          id: 'x',
          siteSlug: 'demo',
          collection: 'news',
          slug: 'x',
          status: 'published',
          updatedAt: '',
          data: {
            headline: 'Big win',
            body: [{ kind: 'paragraph', text: 'The story.' }],
            category: 'News',
            date: '2026-11-01',
          },
        },
      },
      false,
    );
    expect(items[0].item).toMatchObject({
      title: 'Big win',
      story: [{ kind: 'paragraph', text: 'The story.' }],
    });
  });

  it('reads a body stored as plain text as pieces', () => {
    const items = sources.entry.items(
      { from: 'entry', story: 'body' },
      {
        ...data,
        entry: {
          id: 'x',
          siteSlug: 'demo',
          collection: 'news',
          slug: 'x',
          status: 'published',
          updatedAt: '',
          data: { body: 'First.\n\n## Then\n\nSecond.' },
        },
      },
      false,
    );
    expect(items[0].item.story).toEqual([
      { kind: 'paragraph', text: 'First.' },
      { kind: 'heading', text: 'Then' },
      { kind: 'paragraph', text: 'Second.' },
    ]);
  });

  it('offers only story fields to a story, and only words to text', () => {
    const story = sources.entry.query({
      story: { required: true, label: 'Story' },
    });
    const text = sources.entry.query({
      text: { required: true, label: 'Text' },
    });
    expect(
      (
        story.story as unknown as { unwrap: () => { options: string[] } }
      ).unwrap().options,
    ).toEqual(['body']);
    expect(
      (text.text as unknown as { unwrap: () => { options: string[] } }).unwrap()
        .options,
    ).not.toContain('body');
  });
});
