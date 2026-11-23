'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
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
 * banner, rotating quotes. The items share one grid cell, so the slider is
 * as tall as the tallest and nothing jumps. Switching fades the new item
 * in on top of the old one, which stays fully shown underneath until it is
 * covered: the hero's fades are the same on both, so they never dip (a
 * plain cross-fade lets the page show through halfway). The first item is
 * server-rendered and visible before JavaScript runs.
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
  const [index, setIndex] = useState(0);
  // The slide being covered by the current one (data-leaving).
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const still = useSyncExternalStore(watchMotion, prefersStill, () => true);
  const count = cells.length;
  const current = count > 0 ? index % count : 0;
  // Moving on by itself right now: the bars then fill up as time runs.
  const running = autoplay && !paused && !still && count > 1;

  const go = (next: number) => {
    const target = (next + count) % count;
    if (target === current) return;
    setLeaving(current);
    setIndex(target);
  };

  // A fresh timer per slide, so a click restarts the clock (as the bars do).
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      setLeaving(current);
      setIndex((current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, count, current]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative"
      style={
        count > 1 && position !== 'right'
          ? ({ '--slider-controls-room': CONTROLS_ROOM } as CSSProperties)
          : undefined
      }
    >
      <div className="arrange-slider">
        {cells.map(({ key, mark, node }, position) => {
          const active = position === current;
          return (
            <div
              key={key}
              {...mark}
              aria-hidden={!active}
              // Hidden slides must not be reachable with the keyboard either.
              inert={!active}
              data-active={active || undefined}
              data-leaving={(!active && position === leaving) || undefined}
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
            style={{ paddingInline: 'var(--hero-pad)' }}
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
