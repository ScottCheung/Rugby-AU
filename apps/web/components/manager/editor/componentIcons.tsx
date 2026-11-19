import { Box, LayoutGrid, PanelsTopLeft, type LucideIcon } from 'lucide-react';
import { createElement } from 'react';
import type { ComponentType } from '@/lib/components/registry';

/** Manager-only icons. Optional per component: anything missing gets a box. */
const icons: Partial<Record<ComponentType, LucideIcon>> = {
  section: PanelsTopLeft,
  cardGrid: LayoutGrid,
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
