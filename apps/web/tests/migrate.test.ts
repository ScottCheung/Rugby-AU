import { describe, expect, it } from 'vitest';
import { allNodes } from '../lib/components/tree';
import { validateTree } from '../lib/components/validateTree';
import { blocksFromColumns } from '../lib/migrate/blocksFromColumns';
import { sectionBackgrounds } from '../lib/migrate/sectionBackgrounds';
import { splitLayout, splitLayouts } from '../lib/migrate/splitLayouts';
import { articleWithStory, storyBlocks } from '../lib/migrate/storyBlocks';
import type { ComponentNode } from '../lib/types';
import stored from './fixtures/stored-page-columns.json';

/**
 * Pages stored before blocks were components of their own (Section >
 * column, one column type with a flat bag of props). `npm run migrate`
 * upgrades them with blocksFromColumns. If this fails, a stored page would
 * no longer render, or would render differently.
 */
describe('upgrading stored pages to blocks', () => {
  const before = stored.tree as ComponentNode[];
  // The whole chain, as `npm run migrate` runs it: old tones get their
  // current names on the way.
  const after = sectionBackgrounds(blocksFromColumns(before));

  it('gives a page that passes validation', () => {
    const result = validateTree(after);
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it('is idempotent: an upgraded page comes back as the same object', () => {
    expect(blocksFromColumns(after)).toBe(after);
  });

  it('keeps every word, photo and link', () => {
    const strings = (value: unknown): string[] =>
      typeof value === 'string'
        ? [value]
        : Array.isArray(value)
          ? value.flatMap(strings)
          : value && typeof value === 'object'
            ? Object.values(value).flatMap(strings)
            : [];
    const items = (nodes: ComponentNode[]) =>
      allNodes(nodes).flatMap((node) => {
        const own = (node.props.items ??
          (node.props.content as { items?: unknown } | undefined)?.items ??
          []) as unknown[];
        return [
          ...strings(own),
          ...strings([node.props.heading, node.props.intro]),
        ];
      });
    expect(new Set(items(after))).toEqual(new Set(items(before)));
  });

  it('maps each old arrangement to one of the six', () => {
    const blocks = allNodes(after).filter((node) => node.type !== 'section');
    const byType = (type: string) =>
      blocks.find((node) => node.type === type)!.props;
    // slides: one at a time, still moving on by itself
    expect(byType('hero').layout).toEqual({
      arrange: 'slider',
      autoplay: true,
    });
    // single: one per row
    expect(byType('text').layout).toEqual({ arrange: 'list' });
    // masonry: a wall where each photo keeps its shape
    expect(byType('photos').layout).toEqual({ arrange: 'wall' });
    // featured: the first card large
    const news = blocks.find(
      (node) => (node.props.content as { from: string }).from === 'news',
    )!;
    expect(news.type).toBe('cards');
    expect(news.props.layout).toEqual({ arrange: 'featured' });
    // players are people, from the site's players
    expect(byType('people').content).toMatchObject({ from: 'players' });
  });

  it('turns the news template’s packed article into blocks bound to its fields', () => {
    const [section] = blocksFromColumns([
      {
        id: 's',
        type: 'section',
        props: { columns: '1', tone: 'none' },
        children: [{ id: 'c', type: 'column', props: { source: 'entry' } }],
      },
    ]);
    expect(section.props.background).toBe('none');
    expect(
      section.children!.map((node) => [node.type, node.props.content]),
    ).toEqual([
      ['text', { from: 'entry', title: 'headline', text: 'standfirst' }],
      ['photos', { from: 'entry', image: 'image', title: 'headline' }],
      ['text', { from: 'entry', text: 'body' }],
    ]);
  });
});

describe('splitting the two old arrangements into six', () => {
  it('names what each combination of switches really was', () => {
    expect(
      [
        { arrange: 'grid', perRow: '1' },
        { arrange: 'grid', featured: true },
        { arrange: 'grid', masonry: true },
        { arrange: 'grid', perRow: '3', featured: false },
        { arrange: 'carousel', perView: 'one', autoplay: true },
        { arrange: 'carousel', perView: 'several', rows: '2' },
      ].map(splitLayout),
    ).toEqual([
      { arrange: 'list' },
      { arrange: 'featured' },
      { arrange: 'wall' },
      { arrange: 'grid', perRow: '3' },
      { arrange: 'slider', autoplay: true },
      { arrange: 'carousel', rows: '2' },
    ]);
  });

  it('leaves current layouts and trees alone', () => {
    const current = { arrange: 'grid', perRow: '3' };
    expect(splitLayout(current)).toBe(current);
    const tree = blocksFromColumns(stored.tree as ComponentNode[]);
    expect(splitLayouts(tree)).toBe(tree);
  });
});

describe('storyBlocks', () => {
  const template = [
    {
      id: 's',
      type: 'section',
      props: { columns: '1', background: 'none' },
      children: [
        {
          id: 'b',
          type: 'text',
          props: {
            content: { from: 'entry', text: 'body' },
            layout: { arrange: 'list' },
            style: { variant: 'story' },
          },
        },
        {
          id: 'h',
          type: 'text',
          props: {
            content: { from: 'entry', title: 'headline', text: 'standfirst' },
            layout: { arrange: 'list' },
            style: { variant: 'headline' },
          },
        },
      ],
    },
  ];

  it('turns the template’s story text into a Story block, and nothing else', () => {
    const upgraded = storyBlocks(template);
    expect(upgraded[0].children![0]).toEqual({
      id: 'b',
      type: 'story',
      props: {
        content: { from: 'entry', story: 'body' },
        layout: { arrange: 'list' },
        style: { size: 'standard' },
      },
    });
    expect(upgraded[0].children![1]).toBe(template[0].children[1]);
    const checked = validateTree(upgraded);
    expect(checked.ok ? [] : checked.issues).toEqual([]);
  });

  it('is idempotent', () => {
    const once = storyBlocks(template);
    expect(storyBlocks(once)).toBe(once);
  });

  it('splits a plain-text article body into pieces, once', () => {
    const data = { headline: 'A', body: 'One.\n\n## Two\n\nThree.' };
    const upgraded = articleWithStory(data);
    expect(upgraded.body).toEqual([
      { kind: 'paragraph', text: 'One.' },
      { kind: 'heading', text: 'Two' },
      { kind: 'paragraph', text: 'Three.' },
    ]);
    expect(articleWithStory(upgraded)).toBe(upgraded);
  });
});

describe('section backgrounds by their current names', () => {
  const section = (background: string, children: ComponentNode[] = []) =>
    ({
      id: `s-${background}`,
      type: 'section',
      props: { columns: '1', background },
      children,
    }) as ComponentNode;

  it('renames brand to primary and light to secondary, nested too', () => {
    const tree = [section('brand', [section('light')]), section('none')];
    const after = sectionBackgrounds(tree);
    expect(after[0].props.background).toBe('primary');
    expect(after[0].children?.[0].props.background).toBe('secondary');
    expect(after[1]).toBe(tree[1]);
  });

  it('leaves a tree already upgraded as it is', () => {
    const tree = [section('primary'), section('image')];
    expect(sectionBackgrounds(tree)).toBe(tree);
  });
});

