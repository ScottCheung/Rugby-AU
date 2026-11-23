import { describe, expect, it } from 'vitest';
import {
  ancestorIds,
  cloneWithNewIds,
  duplicateNode,
  findLocation,
  findNode,
  insertNode,
  moveBy,
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
    const added = insertNode(tree, leaf('new'), {
      parentId: 'inner',
      index: 0,
    });
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

const ids = (nodes: ComponentNode[]) => nodes.map((node) => node.id);

/** Every id in a tree, depth first. */
const allIds = (nodes: ComponentNode[]): string[] =>
  nodes.flatMap((node) => [node.id, ...allIds(node.children ?? [])]);

describe('moveBy (the tree panel up / down buttons)', () => {
  it('swaps a node with its neighbour, at the root and inside a section', () => {
    const tree = [leaf('a'), leaf('b'), section('s', [leaf('c'), leaf('d')])];
    expect(ids(moveBy(tree, 'b', -1))).toEqual(['b', 'a', 's']);
    expect(ids(moveBy(tree, 'a', 1))).toEqual(['b', 'a', 's']);
    const nested = moveBy(tree, 'd', -1);
    expect(ids(findNode(nested, 's')!.children!)).toEqual(['d', 'c']);
  });

  it('stays put at either end and never leaves its section', () => {
    const tree = [leaf('a'), section('s', [leaf('c'), leaf('d')])];
    expect(moveBy(tree, 'a', -1)).toBe(tree);
    expect(moveBy(tree, 'd', 1)).toBe(tree);
    expect(moveBy(tree, 'c', -1)).toBe(tree);
    expect(moveBy(tree, 'missing', 1)).toBe(tree);
  });
});

describe('duplicateNode', () => {
  it('puts the copy straight after the original, with fresh ids for the whole subtree', () => {
    let next = 0;
    const makeId = () => `copy-${next++}`;
    const tree = makeTree();
    const result = duplicateNode(tree, 'outer', makeId);
    expect(ids(result.tree)).toEqual(['outer', result.copyId, 'sibling']);
    const copy = findNode(result.tree, result.copyId!)!;
    // Same shape and props, none of the old ids.
    expect(allIds([copy])).toEqual(['copy-0', 'copy-1', 'copy-2']);
    expect(copy.children![0].children![0].props).toEqual(
      findNode(tree, 'deep')!.props,
    );
    // Every id in the page is still unique.
    const every = allIds(result.tree);
    expect(new Set(every).size).toBe(every.length);
  });

  it('copies props deeply, so editing the copy leaves the original alone', () => {
    const tree = [leaf('a')];
    const { tree: next, copyId } = duplicateNode(tree, 'a', () => 'b');
    (findNode(next, copyId!)!.props as { cards: unknown[] }).cards.push('x');
    expect(findNode(next, 'a')!.props.cards).toEqual([]);
  });

  it('duplicates a nested node inside its own section', () => {
    const result = duplicateNode(makeTree(), 'deep', () => 'deep-2');
    expect(ids(findNode(result.tree, 'inner')!.children!)).toEqual([
      'deep',
      'deep-2',
    ]);
  });
});

describe('insertNode at a position (the + picker)', () => {
  it('inserts at the end of a nested section without touching other lists', () => {
    const tree = makeTree();
    const next = insertNode(tree, leaf('new'), {
      parentId: 'inner',
      index: 1,
    });
    expect(ids(findNode(next, 'inner')!.children!)).toEqual(['deep', 'new']);
    expect(ids(next)).toEqual(['outer', 'sibling']);
  });
});

describe('removeNode (nested)', () => {
  it('removes a section in a section with everything inside it', () => {
    const next = removeNode(makeTree(), 'inner');
    expect(allIds(next)).toEqual(['outer', 'sibling']);
  });
});

describe('ancestorIds', () => {
  it('lists the sections around a node, outermost first', () => {
    expect(ancestorIds(makeTree(), 'deep')).toEqual(['outer', 'inner']);
    expect(ancestorIds(makeTree(), 'sibling')).toEqual([]);
  });
});
