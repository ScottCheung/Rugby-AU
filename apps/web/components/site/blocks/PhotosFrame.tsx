import type { ReactNode } from 'react';
import type { DrawnItem } from '@/lib/components/blocks/resolve';
import { Lightbox } from '../Lightbox';

/** The full-size viewer around a Photos block: a photo opens in place. */
export function PhotosFrame({
  items,
  children,
}: {
  items: DrawnItem[];
  children: ReactNode;
}) {
  return (
    <Lightbox
      photos={items.map(({ item }) => ({
        url: item.image?.url ?? '',
        alt: item.image?.alt ?? '',
        caption: item.title ?? '',
      }))}
    >
      {children}
    </Lightbox>
  );
}
