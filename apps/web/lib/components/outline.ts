import type { ComponentNode } from '../types';
import { describeSchema } from '../forms/describe';
import type { BlockProps } from './blocks/defineBlock';
import { blockHeadline, blockSummary } from './blocks/summary';
import { getBlock, getDefinition } from './registry';
import { findLocation, findNode, isInside, type Location } from './tree';

/** A Section's own heading, the only component with one. */
function ownName(node: ComponentNode): string | undefined {
  const heading = node.props.heading;
  return typeof heading === 'string' && heading.trim()
    ? heading.trim()
    : undefined;
}

/**
 * A block's name in the outline. Its own heading or title when it has one;
 * a container without one is named after the first named block inside it
 * (`inferred`), so an untitled Section around "Meet the squad" reads as
 * "Meet the squad" rather than one more "Section".
 */
export function nodeName(node: ComponentNode): {
  name: string;
  inferred: boolean;
} {
  const own = ownName(node);
  if (own) return { name: own, inferred: false };
  // A block is named by what it holds: "News · latest 3", "Cards · 6".
  const block = getBlock(node.type);
  if (block)
    return {
      name: blockSummary(block, node.props as BlockProps),
      inferred: false,
    };
  const label = getDefinition(node.type)?.label ?? node.type;
  if (!node.children) return { name: label, inferred: false };
  const first = node.children[0];
  if (!first) return { name: `Empty ${label.toLowerCase()}`, inferred: true };
  const headline = getBlock(first.type)
    ? blockHeadline(first.props as BlockProps)
    : undefined;
  return { name: headline ?? nodeName(first).name, inferred: true };
}

/**
 * The skeleton picture for a container's arrangement: the sketch of the
 * first option field that has sketches (a Section's layout). Undefined for
 * blocks without one, which keep their icon.
 */
export function nodeSketch(node: ComponentNode): string | undefined {
  const definition = getDefinition(node.type);
  if (!definition?.acceptsChildren) return undefined;
  for (const field of describeSchema(definition.schema)) {
    if (field.kind !== 'enum') continue;
    if (!field.options.some((option) => option.sketch)) continue;
    return field.options.find(
      (option) => option.value === node.props[field.key],
    )?.sketch;
  }
  return undefined;
}

/** Where a dragged row lands relative to the row under the pointer. */
export type DropPosition = 'before' | 'after' | 'inside';

/**
 * Turn "drop `id` before / after / inside `targetId`" into a tree location,
 * or null when the drop is not allowed. The page's shape decides: only
 * containers (Sections) sit on the page itself; inside one anything can
 * go (blocks, or another Section); nothing goes inside a block, or inside
 * itself.
 */
export function dropLocation(
  tree: ComponentNode[],
  id: string,
  targetId: string,
  position: DropPosition,
): Location | null {
  if (id === targetId || isInside(tree, targetId, id)) return null;
  const dragged = findNode(tree, id);
  const target = findNode(tree, targetId);
  if (!dragged || !target) return null;
  if (position === 'inside')
    return target.children
      ? { parentId: target.id, index: target.children.length }
      : null;
  const at = findLocation(tree, targetId);
  if (!at) return null;
  if (
    at.parentId === undefined &&
    !getDefinition(dragged.type)?.acceptsChildren
  )
    return null;
  return {
    parentId: at.parentId,
    index: position === 'before' ? at.index : at.index + 1,
  };
}

/** Ids of every block that has children, for "expand all". */
export function containerIds(tree: ComponentNode[]): string[] {
  return tree.flatMap((node) =>
    node.children && node.children.length > 0
      ? [node.id, ...containerIds(node.children)]
      : [],
  );
}
