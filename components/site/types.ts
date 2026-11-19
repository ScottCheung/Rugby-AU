import type { ReactNode } from 'react';
import type { ComponentType, PropsOf } from '@/lib/components/registry';

export type RenderContext = { siteSlug: string };

export type ComponentRenderer<Type extends ComponentType> = (args: {
  props: PropsOf<Type>;
  /** Already-rendered child components (only for containers). */
  children?: ReactNode;
  context: RenderContext;
}) => ReactNode;
