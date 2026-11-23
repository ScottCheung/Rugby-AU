import type { z } from 'zod';
import { cards } from './blocks/cards';
import type { BlockDefinition } from './blocks/defineBlock';
import { hero } from './blocks/hero';
import { matches } from './blocks/matches';
import { people } from './blocks/people';
import { photos } from './blocks/photos';
import { stats } from './blocks/stats';
import { story } from './blocks/story';
import { text } from './blocks/text';
import { section } from './section';

/**
 * The component library. A page is a tree of these: Sections (which hold
 * blocks, or other Sections) and blocks (which hold items). To add a
 * component, define it (lib/components/blocks/*.ts), list it here and give
 * it a renderer (components/site/siteComponents.ts); the editor's form,
 * pickers and validation come from the definition.
 */
export const blockDefinitions = [
  text,
  story,
  hero,
  cards,
  photos,
  stats,
  people,
  matches,
] as const;

export const componentDefinitions = [section, ...blockDefinitions] as const;

export type AnyComponentDefinition = (typeof componentDefinitions)[number];
export type ComponentType = AnyComponentDefinition['type'];
export type BlockType = (typeof blockDefinitions)[number]['type'];
export type PropsOf<Type extends ComponentType> = z.infer<
  Extract<AnyComponentDefinition, { type: Type }>['schema']
>;

export function getDefinition(
  type: string,
): AnyComponentDefinition | undefined {
  return componentDefinitions.find((definition) => definition.type === type);
}

/** A block type's definition, or undefined for a Section or unknown type. */
export function getBlock(type: string): BlockDefinition | undefined {
  return blockDefinitions.find((definition) => definition.type === type) as
    BlockDefinition | undefined;
}
