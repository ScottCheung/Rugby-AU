'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from 'react';

type Placement = { left: number; top: number; width: number };
type Layout = { height: number; places: Placement[] };

/**
 * Wall (masonry): columns where each item keeps its own height. Items go
 * in order, each into the column that is currently shortest (the leftmost
 * one on a tie), so the gaps fill first and the bottom stays even.
 *
 * The CSS grid (.arrange-wall in app/styles/site/arrangements.css) decides
 * how many columns fit and how wide they are; this reads those tracks,
 * measures each item and positions it absolutely. Items never move in the
 * DOM, so nothing remounts (reveal animations, images) when they move.
 * Before it has measured (the server render), the items sit straight in
 * the grid, which is already in row order.
 */
export function Wall({ items }: { items: ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const tracks = style.gridTemplateColumns
        .split(' ')
        .map(parseFloat)
        .filter((width) => width > 0);
      if (!tracks.length) return;
      const gap = parseFloat(style.rowGap) || 0;
      const columnGap = parseFloat(style.columnGap) || 0;
      const lefts = tracks.map((_, index) =>
        tracks.slice(0, index).reduce((sum, w) => sum + w + columnGap, 0),
      );
      const heights = tracks.map(() => 0);
      const slots = Array.from(el.children) as HTMLElement[];
      const places = slots.map((slot) => {
        // Shortest column; within half a pixel counts as a tie → leftmost.
        let column = 0;
        heights.forEach((height, index) => {
          if (height < heights[column] - 0.5) column = index;
        });
        const top = heights[column];
        heights[column] += slot.offsetHeight + gap;
        return { left: lefts[column], top, width: tracks[column] };
      });
      const height = Math.max(0, Math.max(...heights) - gap);
      setLayout((previous) =>
        previous && sameLayout(previous, { height, places })
          ? previous
          : { height, places },
      );
    };
    measure();
    // Re-measure when the wall resizes (column count/width) or any item
    // does (an image finishing loading).
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const slot of Array.from(el.children)) observer.observe(slot);
    return () => observer.disconnect();
  }, [items]);

  const placed = layout && layout.places.length === items.length;
  return (
    <div
      ref={ref}
      className="arrange-wall"
      style={
        placed ? { position: 'relative', height: layout.height } : undefined
      }
    >
      {items.map((item, index) => {
        const place = placed ? layout.places[index] : null;
        const style: CSSProperties | undefined = place
          ? {
              position: 'absolute',
              left: place.left,
              top: place.top,
              width: place.width,
            }
          : undefined;
        return (
          <div
            key={keyOf(item, index)}
            className="arrange-wall-slot"
            style={style}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}

function sameLayout(a: Layout, b: Layout) {
  return (
    Math.abs(a.height - b.height) < 0.5 &&
    a.places.length === b.places.length &&
    a.places.every(
      (place, index) =>
        Math.abs(place.left - b.places[index].left) < 0.5 &&
        Math.abs(place.top - b.places[index].top) < 0.5 &&
        Math.abs(place.width - b.places[index].width) < 0.5,
    )
  );
}

function keyOf(item: ReactNode, index: number) {
  return isValidElement(item) && item.key != null ? item.key : index;
}
