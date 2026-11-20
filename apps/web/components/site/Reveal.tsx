'use client';

import { MotionConfig, motion } from 'motion/react';
import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from 'react';

/** Off in the editor canvas: blocks should simply be there while editing. */
const MotionEnabled = createContext(true);

export function NoMotion({ children }: { children: ReactNode }) {
  return (
    <MotionEnabled.Provider value={false}>{children}</MotionEnabled.Provider>
  );
}

/**
 * For the public site. reducedMotion="user": visitors who ask their system
 * for less motion get fades only, with no movement.
 */
export function SiteMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const elements = { div: motion.div, article: motion.article } as const;

/** Shared feel for every entrance: rise, fade and come into focus. */
export const entrance = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
} as const;
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Plays the entrance the first time the element scrolls into view.
 * `delay` staggers siblings, e.g. cards in a row. Server components can
 * wrap their markup in it; the children stay server-rendered.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: keyof typeof elements;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const enabled = useContext(MotionEnabled);
  if (!enabled) return createElement(as, { className }, children);
  return createElement(
    elements[as],
    {
      className,
      initial: entrance.hidden,
      whileInView: entrance.shown,
      viewport: { once: true, amount: 0.15 },
      transition: { duration: 0.7, ease, delay },
    },
    children,
  );
}
