import {
  BarChart3,
  Newspaper,
  Users,
  Box,
  CalendarDays,
  Contact,
  FileText,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  LayoutGrid,
  PanelsTopLeft,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';
import type { CollectionId } from '@/lib/collections';

/** Manager-only icons for the site's collections. */
export const collectionIcons: Record<CollectionId, LucideIcon> = {
  news: Newspaper,
  players: Users,
};

/** Manager-only icons: one per component type. */
const byType: Record<string, LucideIcon> = {
  section: PanelsTopLeft,
  text: Type,
  story: FileText,
  hero: GalleryHorizontalEnd,
  cards: LayoutGrid,
  photos: ImageIcon,
  stats: BarChart3,
  people: Contact,
  matches: CalendarDays,
};

function iconFor(node: { type: string }): LucideIcon {
  return byType[node.type] ?? Box;
}

export function ComponentIcon({
  node,
  className,
}: {
  node: { type: string };
  className?: string;
}) {
  return createElement(iconFor(node), { className, 'aria-hidden': true });
}
