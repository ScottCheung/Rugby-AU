import type { ComponentNode } from '../types';

/**
 * Pure helpers for editing a page tree at any depth. They never mutate:
 * each returns a new tree that shares the untouched branches.
 */

/** Every node of the tree, parents before their children. */
export function allNodes(tree: ComponentNode[]): ComponentNode[] {
  return tree.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

export function findNode(
  tree: ComponentNode[],
  id: string,
): ComponentNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = node.children && findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

/** Remove a node (and everything inside it). */
export function removeNode(tree: ComponentNode[], id: string): ComponentNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeNode(node.children, id) }
        : node,
    );
}

/** Replace one node's props. */
export function updateNodeProps(
  tree: ComponentNode[],
  id: string,
  props: Record<string, unknown>,
): ComponentNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, props };
    if (!node.children) return node;
    return { ...node, children: updateNodeProps(node.children, id, props) };
  });
}

/** Give a node another type and props, keeping its id and place. */
export function changeNodeType(
  tree: ComponentNode[],
  id: string,
  type: string,
  props: Record<string, unknown>,
): ComponentNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, type, props };
    if (!node.children) return node;
    return {
      ...node,
      children: changeNodeType(node.children, id, type, props),
    };
  });
}

/** Where a node sits: its parent (undefined = page root) and index in that list. */
export type Location = { parentId?: string; index: number };

export function findLocation(
  tree: ComponentNode[],
  id: string,
  parentId?: string,
): Location | undefined {
  for (const [index, node] of tree.entries()) {
    if (node.id === id) return { parentId, index };
    const found = node.children && findLocation(node.children, id, node.id);
    if (found) return found;
  }
  return undefined;
}

/** Insert `node` at `index` in the root list or in `parentId`'s children. */
export function insertNode(
  tree: ComponentNode[],
  node: ComponentNode,
  at: Location,
): ComponentNode[] {
  if (at.parentId === undefined)
    return [...tree.slice(0, at.index), node, ...tree.slice(at.index)];
  return tree.map((current) => {
    if (current.id === at.parentId) {
      const children = current.children ?? [];
      return {
        ...current,
        children: [
          ...children.slice(0, at.index),
          node,
          ...children.slice(at.index),
        ],
      };
    }
    if (!current.children) return current;
    return { ...current, children: insertNode(current.children, node, at) };
  });
}

/** True if `id` is `ancestorId` itself or somewhere inside it. */
export function isInside(
  tree: ComponentNode[],
  id: string,
  ancestorId: string,
): boolean {
  const ancestor = findNode(tree, ancestorId);
  return ancestor !== undefined && findNode([ancestor], id) !== undefined;
}

/**
 * Move a node to a drop position. `to.index` is the gap the user dropped on,
 * counted before the node is taken out. Dropping a container into itself is
 * ignored.
 */
export function moveNode(
  tree: ComponentNode[],
  id: string,
  to: Location,
): ComponentNode[] {
  const node = findNode(tree, id);
  const from = findLocation(tree, id);
  if (!node || !from) return tree;
  if (to.parentId !== undefined && isInside(tree, to.parentId, id)) return tree;
  // Taking the node out shifts later siblings in the same list up by one.
  const index =
    from.parentId === to.parentId && from.index < to.index
      ? to.index - 1
      : to.index;
  return insertNode(removeNode(tree, id), node, {
    parentId: to.parentId,
    index,
  });
}

/** A deep copy of a node with fresh ids (for "duplicate"). */
export function cloneWithNewIds(
  node: ComponentNode,
  makeId: () => string,
): ComponentNode {
  return {
    ...node,
    id: makeId(),
    props: structuredClone(node.props),
    ...(node.children
      ? {
          children: node.children.map((child) =>
            cloneWithNewIds(child, makeId),
          ),
        }
      : {}),
  };
}

/**
 * Move a node one place up (-1) or down (+1) among its siblings. At either
 * end of its list nothing changes: it never jumps into another Section.
 */
export function moveBy(
  tree: ComponentNode[],
  id: string,
  step: -1 | 1,
): ComponentNode[] {
  const from = findLocation(tree, id);
  if (!from) return tree;
  const siblings =
    from.parentId === undefined
      ? tree
      : (findNode(tree, from.parentId)?.children ?? []);
  const index = from.index + step;
  if (index < 0 || index >= siblings.length) return tree;
  const node = siblings[from.index];
  return insertNode(removeNode(tree, id), node, {
    parentId: from.parentId,
    index,
  });
}

/**
 * Put a copy of a node (and everything inside it, all with fresh ids)
 * straight after the original. Returns the new tree and the copy's id.
 */
export function duplicateNode(
  tree: ComponentNode[],
  id: string,
  makeId: () => string,
): { tree: ComponentNode[]; copyId?: string } {
  const node = findNode(tree, id);
  const at = findLocation(tree, id);
  if (!node || !at) return { tree };
  const copy = cloneWithNewIds(node, makeId);
  return {
    tree: insertNode(tree, copy, { ...at, index: at.index + 1 }),
    copyId: copy.id,
  };
}

/** Ids of the Sections around a node, outermost first. */
export function ancestorIds(tree: ComponentNode[], id: string): string[] {
  const location = findLocation(tree, id);
  if (!location?.parentId) return [];
  return [...ancestorIds(tree, location.parentId), location.parentId];
}
