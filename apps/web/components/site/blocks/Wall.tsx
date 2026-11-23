'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Wall: columns where each item keeps its own height, read in rows —
 * item 1, 2, 3 across the top, then 4, 5, 6 under them. CSS `columns`
 * would fill each column top to bottom instead.
 *
 * The CSS grid (.arrange-wall in app/styles/site/arrangements.css) decides how many columns
 * fit; this reads that count and deals the items into the columns in turn.
 * Before it has measured (the server render), the items sit straight in
 * the grid, which is already in row order.
 */
export function Wall({ items }: { items: ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const tracks = getComputedStyle(el)
        .gridTemplateColumns.split(' ')
        .filter(Boolean).length;
      setCount(Math.max(1, tracks));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!count)
    return (
      <div ref={ref} className="arrange-wall">
        {items}
      </div>
    );
  const columns: ReactNode[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => columns[index % count].push(item));
  return (
    <div ref={ref} className="arrange-wall">
      {columns.map((column, index) => (
        <div key={index} className="arrange-wall-column">
          {column}
        </div>
      ))}
    </div>
  );
}
