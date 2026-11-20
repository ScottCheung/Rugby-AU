import type { ComponentType as ReactComponentType, ReactNode } from 'react';
import type { ComponentType, PropsOf } from '@/lib/components/registry';
import { CardGrid } from './CardGrid';
import { ImageSlider } from './ImageSlider';
import { Section } from './Section';
import { Stats } from './Stats';
import { TextBlock } from './TextBlock';

/**
 * Besides its own props, every site component gets the render context:
 * the site (for links) and whether it sits inside another block.
 */
export type RenderContext = { siteSlug: string; nested: boolean };

type SiteComponent<Type extends ComponentType> = ReactComponentType<
  PropsOf<Type> & { children?: ReactNode } & RenderContext
>;

/**
 * Component type -> React component, shared by the public renderer and the
 * manager's canvas. Kept apart from the definitions so schemas can be
 * imported without render code. The mapped type makes the build fail if a
 * registered component has no renderer.
 */
const siteComponents: { [Type in ComponentType]: SiteComponent<Type> } = {
  section: Section,
  textBlock: TextBlock,
  cardGrid: CardGrid,
  imageSlider: ImageSlider,
  stats: Stats,
};

/** Props are typed loosely here: callers must pass props already parsed by the type's schema. */
export type AnySiteComponent = ReactComponentType<
  Record<string, unknown> & { children?: ReactNode } & RenderContext
>;

export function getSiteComponent(type: ComponentType): AnySiteComponent {
  return siteComponents[type] as AnySiteComponent;
}
