/**
 * Motion presets: one rhythm for every animation in a product. Plain values
 * with no animation library dependency, so they work with Motion (Framer
 * Motion), CSS transitions or anything else, on the server and the client.
 *
 *   import { entrance, ease, stagger, timing } from '@scottcheung/ui/motion';
 *
 *   <motion.div
 *     initial={entrance.hidden}
 *     whileInView={entrance.shown}
 *     transition={{ duration: timing.entrance, ease, delay: stagger(i) }}
 *   />
 */

/** Durations and gaps, in seconds. */
export const timing = {
  /** Gap between siblings arriving one after another. */
  step: 0.15,
  /** The longest any sibling waits. */
  maxDelay: 0.6,
  /** A block or card settling in. */
  entrance: 1.2,
  /** One line of a caption coming in. */
  caption: 1.1,
  /** An overlay's background fading in or out. */
  backdrop: 0.6,
  /** One image replacing another. */
  crossfade: 0.7,
  /** A shared element (e.g. a photo) moving between two places. */
  photo: 0.8,
} as const;

/** Slow in, slow out (cubic-bezier): no jump at the start, a soft landing. */
export const ease = [0.4, 0, 0.2, 1] as const;

/** The same curve for CSS: `transition: opacity 0.6s ${cssEase}`. */
export const cssEase = `cubic-bezier(${ease.join(', ')})`;

/** Delay for the nth of a row of siblings, capped at `timing.maxDelay`. */
export const stagger = (index: number, step: number = timing.step) =>
  Math.min(index * step, timing.maxDelay);

/**
 * The entrance: a short rise, a fade and a light blur that clears. Kept
 * small on purpose: content should settle in, not fly in.
 */
export const entrance = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
} as const;

/**
 * Out-cubic: a gentle start and a soft landing, for movement into place.
 * Steeper curves (out-quint, out-expo) make each item pop in.
 */
export const easeOut = [0.33, 1, 0.68, 1] as const;

type Pose = { opacity: number; x?: number; y?: number; filter?: string };

/**
 * Stagger-in for a group of items, one look per arrangement, each made of
 * two or three properties so the looks stay apart. A group plays once, as
 * a whole, when it scrolls into view; each item only waits its turn
 * (`step` seconds after the one before, capped at `staggerMaxDelay`).
 *
 *   grid      fade + rise: cards settle up into their rows
 *   list      fade + slide from the left, the way the rows read
 *   featured  fade + blur, no movement: comes into focus, lead first
 *   wall      fade + a deep rise + a little blur: tiles float up
 *   carousel  fade + slide from the right, the way the strip scrolls
 *   slider    fade + a small rise + a little blur, line by line, on every
 *             slide change (in CSS, app/globals.css)
 */
export const staggerIn = {
  grid: { from: { opacity: 0, y: 24 }, step: 0.15 },
  list: { from: { opacity: 0, x: -32 }, step: 0.15 },
  featured: { from: { opacity: 0, filter: 'blur(8px)' }, step: 0.15 },
  wall: { from: { opacity: 0, y: 48, filter: 'blur(3px)' }, step: 0.15 },
  carousel: { from: { opacity: 0, x: 48 }, step: 0.15 },
  slider: { from: { opacity: 0, y: 12, filter: 'blur(4px)' }, step: 0.15 },
} as const satisfies Record<string, { from: Pose; step: number }>;

export type StaggerLook = keyof typeof staggerIn;

/** Where every stagger-in lands (each look animates only its own keys). */
export const settled = { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } as const;

/**
 * How long one item of a stagger-in takes to settle, in seconds. Its fade
 * and blur run on the slow-in, slow-out `ease`, so it emerges rather than
 * pops; its movement runs on `easeOut`.
 */
export const staggerDuration = 0.9;

/** The longest any item of a stagger-in waits, so big groups still finish. */
export const staggerMaxDelay = 0.9;
