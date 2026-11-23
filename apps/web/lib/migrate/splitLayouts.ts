import type { ComponentNode } from '../types';

type Props = Record<string, unknown>;

/**
 * A block layout stored when there were two arrangements, each with
 * switches (grid: per row, first one large, staggered; carousel: one or
 * several at a time), as one of the six arrangements it really was:
 *
 *   grid, one per row          -> list
 *   grid, first one large      -> featured
 *   grid, staggered            -> wall
 *   carousel, one at a time    -> slider (keeps "move on by itself")
 *   carousel, several          -> carousel (keeps its rows)
 *
 * The same object back when it is already in the current shape.
 */
export function splitLayout(layout: Props): Props {
  const { arrange } = layout;
  if (arrange === 'carousel' && 'perView' in layout) {
    if (layout.perView === 'one')
      return layout.autoplay
        ? { arrange: 'slider', autoplay: true }
        : { arrange: 'slider' };
    return layout.rows
      ? { arrange: 'carousel', rows: layout.rows }
      : { arrange: 'carousel' };
  }
  if (arrange !== 'grid') return layout;
  if (layout.masonry) return { arrange: 'wall' };
  if (layout.perRow === '1') return { arrange: 'list' };
  if (layout.featured) return { arrange: 'featured' };
  if (!('featured' in layout) && !('masonry' in layout)) return layout;
  const { featured: _featured, masonry: _masonry, ...grid } = layout;
  void _featured;
  void _masonry;
  return grid;
}

/** Every block of a tree with its layout in the current shape. Idempotent. */
export function splitLayouts(tree: ComponentNode[]): ComponentNode[] {
  let changed = false;
  const next = tree.map((node) => {
    const children = node.children && splitLayouts(node.children);
    const layout = node.props.layout as Props | undefined;
    const split = layout && splitLayout(layout);
    if (split === layout && children === node.children) return node;
    changed = true;
    return {
      ...node,
      ...(split !== layout ? { props: { ...node.props, layout: split } } : {}),
      ...(children ? { children } : {}),
    };
  });
  return changed ? next : tree;
}
