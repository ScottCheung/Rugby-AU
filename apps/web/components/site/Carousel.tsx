'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * A horizontal strip that scrolls (and snaps) with touch, trackpad or the
 * buttons. The scrollbar is hidden; a thin progress bar under it shows how
 * far along you are and how much of the strip is on screen, and the
 * chevron buttons stop at the ends. Items stretch to the tallest one, so
 * cards of different heights line up. The cards themselves stay
 * server-rendered; only this strip needs JavaScript.
 */
export function Carousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  // How much of the strip is visible (0..1), and how far it has scrolled.
  const [view, setView] = useState({ size: 1, offset: 0 });
  // How far the page column is from each screen edge, when this strip may
  // reach them: the strip then spans the whole width and its padding puts
  // the first and last card back in line with the text.
  const [bleed, setBleed] = useState<{
    left: number;
    right: number;
    inset: { left: number; right: number };
  } | null>(null);

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    setView({
      size:
        element.scrollWidth > 0 ? element.clientWidth / element.scrollWidth : 1,
      offset: max > 1 ? element.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const place = () => {
      const column = element.closest('[data-bleed]');
      if (!column) return setBleed(null);
      // "padded": the Section's content already spans the width with the
      // page's side padding, so that padding is the inset.
      const padded = column.getAttribute('data-bleed') === 'padded';
      const box = column.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const left = Math.max(0, Math.round(box.left));
      const right = Math.max(0, Math.round(width - box.right));
      // Where the text above sits: the page column (72rem, centred) plus
      // its side padding. An edge-to-edge Section's body starts at the edge.
      const gap = parseFloat(getComputedStyle(element).columnGap) || 16;
      const pageInset = Math.max(0, (width - Math.min(width, 1152)) / 2) + gap;
      setBleed({
        left,
        right,
        inset: {
          left: Math.round(padded ? left : Math.max(left, pageInset)),
          right: Math.round(padded ? right : Math.max(right, pageInset)),
        },
      });
    };
    place();
    measure();
    const observer = new ResizeObserver(() => {
      place();
      measure();
    });
    observer.observe(element);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [measure]);

  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.8,
      behavior: 'smooth',
    });

  const fits = view.size >= 0.999;
  const atStart = view.offset <= 0.001;
  const atEnd = view.offset >= 0.999;
  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        ref={track}
        onScroll={measure}
        className="carousel-track"
        style={
          bleed
            ? {
                marginInline: `${-bleed.left}px ${-bleed.right}px`,
                paddingInline: `${bleed.inset.left}px ${bleed.inset.right}px`,
                scrollPaddingInline: `${bleed.inset.left}px ${bleed.inset.right}px`,
              }
            : undefined
        }
      >
        {children}
      </div>
      {!fits && (
        <div
          className="mt-site-xs flex items-center gap-site-sm"
          // In line with the text above, even when the strip reaches the edges.
          style={
            bleed
              ? {
                  paddingInline: `${bleed.inset.left - bleed.left}px ${bleed.inset.right - bleed.right}px`,
                }
              : undefined
          }
        >
          {/* Progress: the thumb is as wide as the part of the strip on screen. */}
          <div
            aria-hidden
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-current/15"
          >
            <span
              className="absolute inset-y-0 rounded-full bg-current/60 transition-[left,width] duration-150"
              style={{
                width: `${view.size * 100}%`,
                left: `${view.offset * (1 - view.size) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-1.5">
            <ArrowButton
              label="Previous"
              disabled={atStart}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft className="size-4" />
            </ArrowButton>
            <ArrowButton
              label="Next"
              disabled={atEnd}
              onClick={() => scroll(1)}
            >
              <ChevronRight className="size-4" />
            </ArrowButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-current/25 transition hover:bg-current/10 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
