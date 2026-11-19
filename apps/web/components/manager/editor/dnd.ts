import {
  pointerWithin,
  type CollisionDetection,
  type DragMoveEvent,
} from '@dnd-kit/core';
import type { ComponentType } from '@/lib/components/registry';
import { findLocation, isInside, type Location } from '@/lib/components/tree';
import type { ComponentNode } from '@/lib/types';
import type { DropTarget } from './editorContext';

/** What is being dragged: an existing block, or a new one from the palette. */
export type DragData =
  | { kind: 'node'; nodeId: string; label: string }
  | { kind: 'new'; type: ComponentType; label: string };

/** What it is over: a block (drop before or after it) or an empty slot in a list. */
export type DropData =
  { kind: 'node'; nodeId: string } | { kind: 'zone'; at: Location };

/**
 * Blocks are nested (a card grid inside a section inside a section), so the
 * pointer is usually over several drop targets. Use the smallest one: the
 * block the user is actually pointing at.
 */
export const innermostUnderPointer: CollisionDetection = (args) => {
  const area = (id: string | number) => {
    const rect = args.droppableRects.get(id);
    return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY;
  };
  return [...pointerWithin(args)]
    .sort((a, b) => area(a.id) - area(b.id))
    .slice(0, 1);
};

/** Turn the current drag position into a drop location, or null if it is not allowed. */
export function resolveDropTarget(
  event: DragMoveEvent,
  tree: ComponentNode[],
): DropTarget | null {
  const { active, over } = event;
  const drag = active.data.current as DragData | undefined;
  const drop = over?.data.current as DropData | undefined;
  if (!drag || !drop || !over) return null;

  let target: DropTarget;
  if (drop.kind === 'zone') {
    target = { at: drop.at };
  } else {
    const location = findLocation(tree, drop.nodeId);
    if (!location) return null;
    // Top half of a block = before it, bottom half = after it.
    const start = event.activatorEvent as PointerEvent;
    const pointerY = start.clientY + event.delta.y;
    const edge =
      pointerY < over.rect.top + over.rect.height / 2 ? 'before' : 'after';
    target = {
      nodeId: drop.nodeId,
      edge,
      at: {
        parentId: location.parentId,
        index: location.index + (edge === 'after' ? 1 : 0),
      },
    };
  }

  // A block cannot be dropped onto itself or into its own children.
  if (drag.kind === 'node') {
    if (target.nodeId && isInside(tree, target.nodeId, drag.nodeId))
      return null;
    if (target.at.parentId && isInside(tree, target.at.parentId, drag.nodeId))
      return null;
  }
  return target;
}
