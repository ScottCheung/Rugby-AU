import type { z } from 'zod';
import { article } from './article';
import { cardGrid } from './cardGrid';
import { imageSlider } from './imageSlider';
import { latestNews } from './latestNews';
import { profileGrid } from './profileGrid';
import { section } from './section';
import { stats } from './stats';
import { textBlock } from './textBlock';

/** Every component editors can place and the renderer can draw. */
export const componentDefinitions = [
  section,
  textBlock,
  cardGrid,
  imageSlider,
  stats,
  article,
  latestNews,
  profileGrid,
] as const;

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
