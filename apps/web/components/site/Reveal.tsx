'use client';

import { MotionConfig, motion } from 'motion/react';
import { ease, entrance, timing } from '@scottcheung/ui/motion';
import { createElement, type ReactNode } from 'react';

/**
 * For the public site. reducedMotion="user": visitors who ask their system
 * for less motion get fades only, with no movement.
 */
export function SiteMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const elements = { div: motion.div, article: motion.article } as const;

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
  return createElement(
    elements[as],
    {
      className,
      initial: entrance.hidden,
      whileInView: entrance.shown,
      // Starts once a quarter of it is on screen, not at the very edge.
      viewport: { once: true, amount: 0.25 },
      transition: { duration: timing.entrance, ease, delay },
    },
    children,
  );
}
