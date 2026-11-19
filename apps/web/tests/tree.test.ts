import { describe, expect, it } from 'vitest';
import {
  addNode,
  cloneWithNewIds,
  findLocation,
  findNode,
  insertNode,
  moveNode,
  removeNode,
  updateNodeProps,
} from '../lib/components/tree';
import type { ComponentNode } from '../lib/types';

const leaf = (id: string): ComponentNode => ({
  id,
  type: 'cardGrid',
  props: { title: id, cards: [] },
});
const section = (
  id: string,
  children: ComponentNode[] = [],
): ComponentNode => ({
  id,
  type: 'section',
  props: { layout: 'full', background: 'none' },
  children,
});

// root: [ outer [ inner [ deep ] ], sibling ]
const makeTree = () => [
  section('outer', [section('inner', [leaf('deep')])]),
  leaf('sibling'),
];

describe('findNode', () => {
  it('finds nodes at any depth', () => {
    const tree = makeTree();
    expect(findNode(tree, 'sibling')?.id).toBe('sibling');
    expect(findNode(tree, 'deep')?.id).toBe('deep');
    expect(findNode(tree, 'missing')).toBeUndefined();
  });
});

describe('addNode', () => {
  it('appends to the root when no parent is given', () => {
    const tree = addNode(makeTree(), leaf('new'));
    expect(tree.map((node) => node.id)).toEqual(['outer', 'sibling', 'new']);
  });

  it('appends inside a nested section', () => {
    const tree = addNode(makeTree(), leaf('new'), 'inner');
    expect(findNode(tree, 'inner')?.children?.map((node) => node.id)).toEqual([
      'deep',
      'new',
    ]);
  });

  it('creates the children list when the parent has none yet', () => {
    const tree = addNode([section('empty')], leaf('new'), 'empty');
    expect(findNode(tree, 'empty')?.children).toEqual([leaf('new')]);
  });

  it('leaves the tree unchanged when the parent does not exist', () => {
    expect(addNode(makeTree(), leaf('new'), 'missing')).toEqual(makeTree());
  });
});

describe('removeNode', () => {
  it('removes a deep node', () => {
    const tree = removeNode(makeTree(), 'deep');
    expect(findNode(tree, 'deep')).toBeUndefined();
    expect(findNode(tree, 'inner')?.children).toEqual([]);
  });

  it('removes a section together with its children', () => {
    const tree = removeNode(makeTree(), 'outer');
    expect(tree.map((node) => node.id)).toEqual(['sibling']);
    expect(findNode(tree, 'deep')).toBeUndefined();
  });
});

describe('updateNodeProps', () => {
  it('replaces the props of a deep node only', () => {
    const tree = updateNodeProps(makeTree(), 'deep', {
      title: 'Changed',
      cards: [],
    });
    expect(findNode(tree, 'deep')?.props).toEqual({
      title: 'Changed',
      cards: [],
    });
    expect(findNode(tree, 'sibling')?.props).toEqual(leaf('sibling').props);
  });
});

describe('immutability', () => {
  it('never mutates the input and shares untouched branches', () => {
    const tree = makeTree();
    const snapshot = structuredClone(tree);
    const added = addNode(tree, leaf('new'), 'inner');
    removeNode(tree, 'deep');
    updateNodeProps(tree, 'deep', {});
    expect(tree).toEqual(snapshot);
    expect(added[1]).toBe(tree[1]); // the sibling branch was not copied
  });
});

describe('findLocation', () => {
  it('returns the parent and index at any depth', () => {
    const tree = makeTree();
    expect(findLocation(tree, 'sibling')).toEqual({
      parentId: undefined,
      index: 1,
    });
    expect(findLocation(tree, 'deep')).toEqual({ parentId: 'inner', index: 0 });
    expect(findLocation(tree, 'missing')).toBeUndefined();
  });
});

describe('insertNode', () => {
  it('inserts at an index in the root and inside a section', () => {
    expect(
      insertNode(makeTree(), leaf('new'), { index: 1 }).map((node) => node.id),
    ).toEqual(['outer', 'new', 'sibling']);
    const nested = insertNode(makeTree(), leaf('new'), {
      parentId: 'inner',
      index: 0,
    });
    expect(findNode(nested, 'inner')?.children?.map((node) => node.id)).toEqual(
      ['new', 'deep'],
    );
  });
});

describe('moveNode', () => {
  const ids = (nodes: ComponentNode[]) => nodes.map((node) => node.id);

  it('moves down and up within the same list (drop gaps count the node itself)', () => {
    const tree = [leaf('a'), leaf('b'), leaf('c')];
    expect(ids(moveNode(tree, 'a', { index: 3 }))).toEqual(['b', 'c', 'a']);
    expect(ids(moveNode(tree, 'a', { index: 2 }))).toEqual(['b', 'a', 'c']);
    expect(ids(moveNode(tree, 'c', { index: 0 }))).toEqual(['c', 'a', 'b']);
    expect(ids(moveNode(tree, 'b', { index: 1 }))).toEqual(['a', 'b', 'c']);
  });

  it('moves a node into a nested section and back out to the root', () => {
    const inside = moveNode(makeTree(), 'sibling', {
      parentId: 'inner',
      index: 1,
    });
    expect(ids(inside)).toEqual(['outer']);
    expect(ids(findNode(inside, 'inner')?.children ?? [])).toEqual([
      'deep',
      'sibling',
    ]);
    const out = moveNode(inside, 'deep', { index: 0 });
    expect(ids(out)).toEqual(['deep', 'outer']);
  });

  it('refuses to drop a section into itself or its own children', () => {
    const tree = makeTree();
    expect(moveNode(tree, 'outer', { parentId: 'outer', index: 0 })).toBe(tree);
    expect(moveNode(tree, 'outer', { parentId: 'inner', index: 0 })).toBe(tree);
  });
});

describe('cloneWithNewIds', () => {
  it('copies a section and everything inside it with fresh ids', () => {
    let next = 0;
    const copy = cloneWithNewIds(makeTree()[0], () => `copy-${next++}`);
    expect(copy.id).toBe('copy-0');
    expect(copy.children?.[0].id).toBe('copy-1');
    expect(copy.children?.[0].children?.[0]).toMatchObject({
      id: 'copy-2',
      type: 'cardGrid',
    });
  });
});
