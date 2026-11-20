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
