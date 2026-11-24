'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { Cell } from './Arrangement';

const INTERVAL_MS = 6000;

/** Visitors who prefer less motion: nothing moves on by itself. */
const STILL = '(prefers-reduced-motion: reduce)';
const prefersStill = () => window.matchMedia(STILL).matches;
const watchMotion = (onChange: () => void) => {
  const query = window.matchMedia(STILL);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/**
 * A carousel that shows one item at a time, with arrows and dots: a hero
 * banner, rotating quotes. The items sit side by side in a flex row that
 * scrolls and snaps, so a finger or trackpad swipes between them natively
 * (and a mouse can drag); the controls and autoplay just scroll the same
 * track. Flex rows stretch, so the slider is as tall as the tallest item
 * and nothing jumps. The first item is server-rendered and visible before
 * JavaScript runs.
 */
type Indicator = 'pill' | 'dots' | 'bars' | 'numbers';
type Theme = 'primary' | 'secondary' | 'glass' | 'none';
type Position = 'left' | 'center' | 'right';

/**
 * The controls' colours, named like a Section's background: the plate
 * behind them (none for None) and the ink of the marks and arrows.
 */
const themes: Record<Theme, { plate: string; hover: string }> = {
  primary: {
    plate:
      'bg-brand text-brand-contrast shadow-[0_8px_24px_-10px_rgb(0_0_0/0.45)]',
    hover: 'hover:bg-white/15',
  },
  secondary: {
    plate:
      'bg-surface-light text-brand shadow-[0_8px_24px_-10px_rgb(0_0_0/0.35)]',
    hover: 'hover:bg-brand/10',
  },
  glass: {
    plate:
      'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] backdrop-blur-xl',
    hover: 'hover:bg-white/15',
  },
  none: {
    plate: 'text-white [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.5))]',
    hover: 'hover:bg-white/15',
  },
};

const positions: Record<Position, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

/**
 * Room a slide keeps under its content for controls on the left or in the
 * middle, where they would otherwise sit on a hero's caption (HeroItem
 * reads it). On the right they share the row with the caption's button.
 */
const CONTROLS_ROOM = '3.75rem';

export function Slider({
  label,
  autoplay,
  indicator = 'pill',
  theme = 'secondary',
  position = 'right',
  cells,
}: {
  label: string;
  autoplay: boolean;
  indicator?: Indicator;
  theme?: Theme;
  position?: Position;
  cells: Cell[];
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const still = useSyncExternalStore(watchMotion, prefersStill, () => true);
  const count = cells.length;
  const current = count > 0 ? Math.min(index, count - 1) : 0;
  // Moving on by itself right now: the bars then fill up as time runs.
  const running = autoplay && !paused && !dragging && !still && count > 1;

  /** Scroll the track to a slide; the scroll handler then sets the index. */
  const go = useCallback(
    (next: number) => {
      const element = track.current;
      if (!element || count === 0) return;
      const target = (next + count) % count;
      element.scrollTo({
        left: target * element.clientWidth,
        behavior: prefersStill() ? 'auto' : 'smooth',
      });
    },
    [count],
  );

  // The current slide follows the scroll position, so a swipe, a trackpad
  // or the controls all end up in the same place.
  const onScroll = () => {
    const element = track.current;
    if (!element || element.clientWidth === 0) return;
    const next = Math.round(element.scrollLeft / element.clientWidth);
    setIndex((previous) => (previous === next ? previous : next));
  };

  // Keep the same slide in view when the track changes width.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width || width === 0) return;
      const slide = Math.round(element.scrollLeft / width);
      width = element.clientWidth;
      element.scrollTo({ left: slide * width });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A fresh timer per slide, so a swipe or click restarts the clock.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => go(current + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, current, go]);

  // A mouse drags the track like a finger would (touch and trackpads
  // scroll it natively). Snapping is off while dragging, then the nearest
  // slide, or the next one after a quick flick, settles into place.
  const drag = useRef<{ x: number; left: number; t: number } | null>(null);
  const moved = useRef(false);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = track.current;
    if (event.pointerType !== 'mouse' || event.button !== 0 || !element) return;
    drag.current = {
      x: event.clientX,
      left: element.scrollLeft,
      t: event.timeStamp,
    };
    moved.current = false;
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = track.current;
    const start = drag.current;
    if (!element || !start) return;
    const dx = event.clientX - start.x;
    if (!moved.current) {
      if (Math.abs(dx) < 6) return;
      moved.current = true;
      setDragging(true);
      element.setPointerCapture(event.pointerId);
    }
    element.scrollLeft = start.left - dx;
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = track.current;
    const start = drag.current;
    drag.current = null;
    if (!element || !start || !moved.current) return;
    setDragging(false);
    const dx = event.clientX - start.x;
    const width = element.clientWidth;
    const from = Math.round(start.left / width);
    const flick = Math.abs(dx) / Math.max(1, event.timeStamp - start.t) > 0.4;
    const target =
      flick || Math.abs(dx) > width * 0.2 ? from + (dx < 0 ? 1 : -1) : from;
    element.scrollTo({
      left: Math.max(0, Math.min(count - 1, target)) * width,
      behavior: 'smooth',
    });
  };
  // A drag must not also follow the link it started on.
  const onClickCapture = (event: ReactMouseEvent) => {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(current - 1);
        if (event.key === 'ArrowRight') go(current + 1);
      }}
      className="relative"
      style={
        count > 1 && position !== 'right'
          ? ({ '--slider-controls-room': CONTROLS_ROOM } as CSSProperties)
          : undefined
      }
    >
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        data-dragging={dragging || undefined}
        className="arrange-slider"
      >
        {cells.map(({ key, mark, node }, slide) => {
          const active = slide === current;
          return (
            <div
              key={key}
              {...mark}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slide + 1} of ${count}`}
              aria-hidden={!active}
              // Hidden slides must not be reachable with the keyboard either.
              inert={!active}
              data-active={active || undefined}
              className="arrange-cell"
            >
              {node}
            </div>
          );
        })}
      </div>
      {count > 1 && (
        // Inside the slides, on the same column and padding as a hero's
        // caption (max-w-6xl, --hero-pad on the side and the bottom), so the
        // controls line up with the content instead of the slide's edge.
        <div
          className="slider-controls pointer-events-none absolute inset-x-0 z-30"
          style={
            {
              '--slider-ms': `${INTERVAL_MS}ms`,
              bottom: 'var(--hero-pad)',
            } as CSSProperties
          }
        >
          <div
            className={`mx-auto flex w-full max-w-6xl ${positions[position]}`}
            style={{ paddingInline: 'var(--hero-pad-x, var(--hero-pad))' }}
          >
            <Controls
              indicator={indicator}
              theme={themes[theme]}
              bare={theme === 'none'}
              running={running}
              count={count}
              current={current}
              keys={cells.map((cell) => cell.key)}
              go={go}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The controls in one of four looks, each on the theme's plate:
 *
 *   pill     arrows either side of the dots; the current dot is a dash
 *   dots     the dots alone
 *   bars     a bar per slide that fills as the slide's time runs out
 *   numbers  arrows either side of "01 — 03"
 *
 * Every look has a button per slide or arrows, so each works by keyboard.
 */
function Controls({
  indicator,
  theme,
  bare,
  running,
  count,
  current,
  keys,
  go,
}: {
  indicator: Indicator;
  theme: (typeof themes)[Theme];
  /** No plate: the marks sit on the slide itself. */
  bare: boolean;
  running: boolean;
  count: number;
  current: number;
  keys: string[];
  go: (index: number) => void;
}) {
  const arrow = (side: 'prev' | 'next') => (
    <button
      type="button"
      aria-label={side === 'prev' ? 'Previous' : 'Next'}
      onClick={() => go(side === 'prev' ? current - 1 : current + 1)}
      className={`grid size-9 place-items-center rounded-full transition-colors ${theme.hover}`}
    >
      {side === 'prev' ? (
        <ChevronLeft className="size-[1.1rem]" strokeWidth={2.25} />
      ) : (
        <ChevronRight className="size-[1.1rem]" strokeWidth={2.25} />
      )}
    </button>
  );
  const label = (dot: number) => `Show ${dot + 1} of ${count}`;
  const dots = (size: 'sm' | 'md') =>
    keys.map((key, dot) => (
      // A larger hit area than the dot it holds.
      <button
        key={key}
        type="button"
        aria-label={label(dot)}
        aria-current={dot === current || undefined}
        onClick={() => go(dot)}
        className="group grid h-6 place-items-center"
      >
        <span
          className={`block rounded-full bg-current transition-all duration-300 ${
            size === 'sm' ? 'h-1.5' : 'h-2'
          } ${
            dot === current
              ? size === 'sm'
                ? 'w-5'
                : 'w-6'
              : `${size === 'sm' ? 'w-1.5' : 'w-2'} opacity-40 group-hover:opacity-75`
          }`}
        />
      </button>
    ));
  const pad = (padded: string) => (bare ? '' : padded);
  const plate = `pointer-events-auto flex items-center rounded-full ${theme.plate}`;
  const two = (value: number) => String(value).padStart(2, '0');

  switch (indicator) {
    case 'dots':
      return (
        <div className={`${plate} gap-2 ${pad('px-3.5 py-1.5')}`}>
          {dots('md')}
        </div>
      );
    case 'bars':
      return (
        <div className={`${plate} gap-1.5 ${pad('px-4 py-1.5')}`}>
          {keys.map((key, bar) => (
            <button
              key={key}
              type="button"
              aria-label={label(bar)}
              aria-current={bar === current || undefined}
              onClick={() => go(bar)}
              className="group grid h-6 w-9 place-items-center @md:w-12"
            >
              <span className="relative block h-[3px] w-full overflow-hidden rounded-full">
                <span className="absolute inset-0 bg-current opacity-30 transition-opacity group-hover:opacity-50" />
                {bar < current && (
                  <span className="absolute inset-0 bg-current" />
                )}
                {bar === current && (
                  <span
                    // A new element per slide (and per resume), so the
                    // fill starts again from empty.
                    key={`${current}-${running}`}
                    className={`absolute inset-0 origin-left bg-current ${running ? 'slider-fill' : ''}`}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      );
    case 'numbers':
      return (
        <div className={`${plate} gap-0.5 ${pad('p-1')}`}>
          {arrow('prev')}
          <span
            aria-live="polite"
            className="flex items-center gap-2 px-1.5 text-sm font-semibold tabular-nums"
          >
            {two(current + 1)}
            <span aria-hidden className="h-px w-5 bg-current opacity-40" />
            <span className="opacity-55">{two(count)}</span>
          </span>
          {arrow('next')}
        </div>
      );
    default:
      return (
        <div className={`${plate} gap-0.5 ${pad('p-1')}`}>
          {arrow('prev')}
          <div className="flex items-center gap-1.5 px-1">{dots('sm')}</div>
          {arrow('next')}
        </div>
      );
  }
}
