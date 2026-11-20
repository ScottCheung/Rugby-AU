import {
  Box,
  GalleryHorizontalEnd,
  LayoutGrid,
  PanelsTopLeft,
  type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';
import type { ComponentType } from '@/lib/components/registry';

/** Manager-only icons. Optional per component: anything missing gets a box. */
const icons: Partial<Record<ComponentType, LucideIcon>> = {
  section: PanelsTopLeft,
  cardGrid: LayoutGrid,
  imageSlider: GalleryHorizontalEnd,
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
