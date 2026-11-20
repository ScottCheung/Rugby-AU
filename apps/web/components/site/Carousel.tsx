'use client';

import { useRef, type ReactNode } from 'react';

/**
 * A horizontal strip that scrolls (and snaps) with touch, trackpad or the
 * arrow buttons. The cards themselves stay server-rendered; only these two
 * buttons need JavaScript.
 */
export function Carousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.8,
      behavior: 'smooth',
    });

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-site-sm overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin]"
      >
        {children}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <ArrowButton label="Previous" onClick={() => scroll(-1)}>
          ←
        </ArrowButton>
        <ArrowButton label="Next" onClick={() => scroll(1)}>
          →
        </ArrowButton>
      </div>
    </div>
  );
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-current/25 text-lg transition hover:bg-current/10"
    >
      {children}
    </button>
  );
}
