/**
 * Every animation timing on the public site, in one place so the whole
 * site moves with one rhythm. Plain module (not 'use client'), so server
 * components can use it too. Seconds.
 */
export const timing = {
  /** Gap between siblings arriving one after another. */
  step: 0.15,
  /** The longest any sibling waits. */
  maxDelay: 0.6,
  /** A block or card settling in. */
  entrance: 1.2,
  /** One line of a slider caption. */
  caption: 1.1,
  /** The photo viewer: background, crossfade, and the photo growing. */
  backdrop: 0.6,
  crossfade: 0.7,
  photo: 0.8,
} as const;

/** Slow in, slow out: no jump at the start, a soft landing. */
export const ease = [0.4, 0, 0.2, 1] as const;

/** Delay for the nth of a row of siblings. */
export const stagger = (index: number, step: number = timing.step) =>
  Math.min(index * step, timing.maxDelay);

/**
 * Blocks that do not play an entrance of their own: a Section's children
 * animate instead, and Card Grid and Latest news animate each card. Without
 * this the same content would animate twice (the grid, then its cards).
 */
const animatedInside = new Set(['section', 'cardGrid', 'latestNews']);

export const animatesAsWhole = (type: string) => !animatedInside.has(type);
