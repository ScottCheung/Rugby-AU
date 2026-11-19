import type { z } from 'zod';
import { cardGrid } from './cardGrid';
import { section } from './section';

/** Every component editors can place and the renderer can draw. */
export const componentDefinitions = [section, cardGrid] as const;

export type AnyComponentDefinition = (typeof componentDefinitions)[number];
export type ComponentType = AnyComponentDefinition['type'];
export type PropsOf<Type extends ComponentType> = z.infer<
  Extract<AnyComponentDefinition, { type: Type }>['schema']
>;

export function getDefinition(
  type: string,
): AnyComponentDefinition | undefined {
  return componentDefinitions.find((definition) => definition.type === type);
}
