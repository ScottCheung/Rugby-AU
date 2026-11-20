import {
  BarChart3,
  Box,
  GalleryHorizontalEnd,
  LayoutGrid,
  PanelsTopLeft,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';
import type { ComponentType } from '@/lib/components/registry';

/** Manager-only icons. Optional per component: anything missing gets a box. */
const icons: Partial<Record<ComponentType, LucideIcon>> = {
  section: PanelsTopLeft,
  textBlock: Type,
  cardGrid: LayoutGrid,
  imageSlider: GalleryHorizontalEnd,
  stats: BarChart3,
};

export function ComponentIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  return createElement(icons[type as ComponentType] ?? Box, {
    className,
    'aria-hidden': true,
  });
}
