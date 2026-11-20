import type { ComponentType as ReactComponentType, ReactNode } from 'react';
import type { ComponentType, PropsOf } from '@/lib/components/registry';
import { CardGrid } from './CardGrid';
import { ImageSlider } from './ImageSlider';
import { Section } from './Section';
import { TextBlock } from './TextBlock';

type SiteComponent<Type extends ComponentType> = ReactComponentType<
  PropsOf<Type> & { children?: ReactNode; siteSlug: string }
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
};

/** Props are typed loosely here: callers must pass props already parsed by the type's schema. */
export type AnySiteComponent = ReactComponentType<
  Record<string, unknown> & { children?: ReactNode; siteSlug: string }
>;

export function getSiteComponent(type: ComponentType): AnySiteComponent {
  return siteComponents[type] as AnySiteComponent;
}
