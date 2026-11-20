import type { ComponentNode } from '../types';

export type BlockWidth = 'contained' | 'full-background' | 'full-width';

/**
 * How wide a block placed directly on the page is drawn. Only a Section can
 * leave the page column (its `width` prop); everything else stays inside it.
 * Shared by the public renderer and the editor canvas so they always agree.
 */
export function rootBlockWidth(node: ComponentNode): BlockWidth {
  if (node.type !== 'section') return 'contained';
  const width = node.props.width;
  return width === 'full-background' || width === 'full-width'
    ? width
    : 'contained';
}
