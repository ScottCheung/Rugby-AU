import type { ComponentNode } from '../types';
import { getDefinition, type ComponentType } from './registry';

/** A new node of `type` with that component's default props. */
export function createNode(
  type: ComponentType,
  props?: Record<string, unknown>,
): ComponentNode {
  const definition = getDefinition(type);
  if (!definition) throw new Error(`Unknown component type "${type}"`);
  return {
    id: crypto.randomUUID(),
    type,
    props: structuredClone(props ?? definition.defaultProps),
    ...(definition.acceptsChildren ? { children: [] } : {}),
  };
}
