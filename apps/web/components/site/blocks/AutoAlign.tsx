'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

type Side = 'left' | 'center' | 'right';

const aligns: Record<Side, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

/**
 * Aligns an item by where its cell sits in its row: the first in a row
 * leans left, the last leans right, the rest (and one alone) are centred.
 * Rows are read from the page, so it follows wrapping and "Auto" per row.
 * Before it has measured (and without JavaScript) it is centred.
 */
export function AutoAlign({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<Side>('center');

  useEffect(() => {
    const cell = ref.current?.closest('.arrange-cell');
    const parent = cell?.parentElement;
    if (!cell || !parent) return;
    const measure = () => {
      // offsetTop, not the drawn box: an entrance animation moves cells.
      const top = (el: Element) => (el as HTMLElement).offsetTop;
      const row = Array.from(parent.children).filter(
        (one) =>
          one.classList.contains('arrange-cell') && top(one) === top(cell),
      );
      const at = row.indexOf(cell);
      setSide(
        row.length < 2 || (at > 0 && at < row.length - 1)
          ? 'center'
          : at === 0
            ? 'left'
            : 'right',
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} ${aligns[side]}`}>
      {children}
    </div>
  );
}
