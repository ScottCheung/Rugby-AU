import type { ComponentNode } from '../types';

/**
 * Section backgrounds stored under their old names, by the names they have
 * now (the same look): brand -> primary, light -> secondary.
 */
const renamed: Record<string, string> = {
  brand: 'primary',
  light: 'secondary',
};

/** Every Section of a tree with its background's current name. Idempotent. */
export function sectionBackgrounds(tree: ComponentNode[]): ComponentNode[] {
  let changed = false;
  const next = tree.map((node) => {
    const children = node.children && sectionBackgrounds(node.children);
    const old = node.props.background;
    const rename =
      node.type === 'section' && typeof old === 'string' && renamed[old];
    if (!rename && children === node.children) return node;
    changed = true;
    return {
      ...node,
      ...(rename ? { props: { ...node.props, background: rename } } : {}),
      ...(children ? { children } : {}),
    };
  });
  return changed ? next : tree;
}
