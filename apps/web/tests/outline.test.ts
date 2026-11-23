import { describe, expect, it } from 'vitest';
import {
  containerIds,
  dropLocation,
  nodeName,
  nodeSketch,
} from '../lib/components/outline';
import type { ComponentNode } from '../lib/types';

const block = (
  id: string,
  type: string,
  content: Record<string, unknown>,
): ComponentNode => ({
  id,
  type,
  props: { content, layout: { arrange: 'grid' }, style: {} },
});
const cards = (id: string, count = 2) =>
  block(id, 'cards', {
    from: 'items',
    items: Array.from({ length: count }, () => ({})),
  });
const section = (
  id: string,
  children: ComponentNode[] = [],
  props: Record<string, unknown> = {},
): ComponentNode => ({
  id,
  type: 'section',
  props: {
    columns: children.length === 2 ? '1-1' : '1',
    background: 'none',
    ...props,
  },
  children,
});

// root: [ a [ a1, a2 ], b [ b1 ] ]
const makeTree = () => [
  section('a', [
    cards('a1', 3),
    block('a2', 'cards', { from: 'news', mode: 'latest', limit: 3 }),
  ]),
  section('b', [cards('b1', 1)]),
];

describe('nodeName', () => {
  it('uses a Section heading', () => {
    expect(nodeName(section('s', [], { heading: 'Squad' }))).toEqual({
      name: 'Squad',
      inferred: false,
    });
  });

  it('names a block by what it holds', () => {
    expect(nodeName(cards('c', 6)).name).toBe('Cards · 6');
    expect(nodeName(makeTree()[0].children![1]).name).toBe('News · latest 3');
    expect(
      nodeName(
        block('t', 'text', {
          from: 'items',
          items: [{ title: 'About the Wallabies', text: '…' }],
        }),
      ).name,
    ).toBe('About the Wallabies');
  });

  it('names an untitled Section after its first block', () => {
    expect(nodeName(makeTree()[0])).toEqual({
      name: 'Cards · 3',
      inferred: true,
    });
  });

  it('says when a Section is empty', () => {
    expect(nodeName(section('s'))).toEqual({
      name: 'Empty section',
      inferred: true,
    });
  });
});

describe('nodeSketch', () => {
  it('pictures a Section by its columns', () => {
    expect(nodeSketch(makeTree()[0])).toBe('two-column');
    expect(nodeSketch(section('s'))).toBe('one-column');
  });

  it('leaves blocks to their icon', () => {
    expect(nodeSketch(cards('c'))).toBeUndefined();
  });
});

describe('dropLocation', () => {
  it('moves Sections among Sections', () => {
    expect(dropLocation(makeTree(), 'b', 'a', 'before')).toEqual({
      parentId: undefined,
      index: 0,
    });
  });

  it('moves blocks anywhere inside Sections, and into a Section', () => {
    const tree = makeTree();
    expect(dropLocation(tree, 'a2', 'a1', 'before')).toEqual({
      parentId: 'a',
      index: 0,
    });
    expect(dropLocation(tree, 'b1', 'a1', 'after')).toEqual({
      parentId: 'a',
      index: 1,
    });
    expect(dropLocation(tree, 'a1', 'b', 'inside')).toEqual({
      parentId: 'b',
      index: 1,
    });
    // A Section can go inside another one.
    expect(dropLocation(tree, 'b', 'a', 'inside')).toEqual({
      parentId: 'a',
      index: 2,
    });
  });

  it('refuses drops onto itself, into itself, into a block or onto the page', () => {
    const tree = makeTree();
    expect(dropLocation(tree, 'a', 'a', 'before')).toBeNull();
    expect(dropLocation(tree, 'a', 'a1', 'inside')).toBeNull();
    expect(dropLocation(tree, 'b1', 'a1', 'inside')).toBeNull();
    // Only Sections sit on the page itself.
    expect(dropLocation(tree, 'a1', 'b', 'after')).toBeNull();
  });
});

describe('containerIds', () => {
  it('lists every block with children', () => {
    expect(containerIds(makeTree())).toEqual(['a', 'b']);
  });
});
