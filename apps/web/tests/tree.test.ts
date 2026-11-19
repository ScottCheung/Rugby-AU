import { describe, expect, it } from 'vitest';
import {
  addNode,
  findNode,
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
