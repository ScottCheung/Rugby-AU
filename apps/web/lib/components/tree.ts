import type { ComponentNode } from '../types';

/**
 * Pure helpers for editing a page tree at any depth. They never mutate:
 * each returns a new tree that shares the untouched branches.
 */

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

/** Append `node` at the root, or as the last child of `parentId`. */
export function addNode(
  tree: ComponentNode[],
  node: ComponentNode,
  parentId?: string,
): ComponentNode[] {
  if (parentId === undefined) return [...tree, node];
  return tree.map((current) => {
    if (current.id === parentId)
      return { ...current, children: [...(current.children ?? []), node] };
    if (!current.children) return current;
    return { ...current, children: addNode(current.children, node, parentId) };
  });
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
