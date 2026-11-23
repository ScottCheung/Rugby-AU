'use client';

import { MotionConfig, motion, type Variants } from 'motion/react';
import {
  ease,
  easeOut,
  settled,
  staggerDuration,
  staggerMaxDelay,
  staggerIn,
  type StaggerLook,
} from '@scottcheung/ui/motion';
import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { DataAttributes } from '@/lib/components/items';

/**
 * For the public site. reducedMotion="user": visitors who ask their system
 * for less motion get fades only, with no movement.
 */
export function SiteMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** The group's look, so its items need not be told. */
const Look = createContext<StaggerLook>('grid');

const variantsFor = (look: StaggerLook): Variants => ({
  hidden: staggerIn[look].from,
  shown: (index: number) => {
    const delay = Math.min(index * staggerIn[look].step, staggerMaxDelay);
    // The fade and blur clear slowly in and out; the move eases into place.
    const fade = { duration: staggerDuration, ease, delay };
    // Only the properties this look moves.
    const to = Object.fromEntries(
      Object.keys(staggerIn[look].from).map((key) => [
        key,
        settled[key as keyof typeof settled],
      ]),
    );
    return {
      ...to,
      transition: {
        duration: staggerDuration,
        ease: easeOut,
        delay,
        opacity: fade,
        filter: fade,
      },
    };
  },
});
const variants = Object.fromEntries(
  (Object.keys(staggerIn) as StaggerLook[]).map((look) => [
    look,
    variantsFor(look),
  ]),
) as Record<StaggerLook, Variants>;

/**
 * A group of items that stagger in once, together, the first time the
 * group scrolls into view: one viewport watcher for the whole group, not
 * one per item. Items (RevealItem) follow the group's state through
 * Motion's variants. Until then the group carries data-reveal="pending",
 * which CSS-driven looks (the slider's caption) wait on.
 */
export function RevealGroup({
  look,
  className,
  style,
  children,
}: {
  look: StaggerLook;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [seen, setSeen] = useState(false);
  return (
    <Look.Provider value={look}>
      <motion.div
        className={className}
        style={style}
        data-reveal={seen ? undefined : 'pending'}
        initial="hidden"
        whileInView="shown"
        // Starts once the group's top is well onto the screen (past the
        // bottom 25%), not as it peeks in; by the top edge, so a tall grid
        // on a phone starts too.
        viewport={{ once: true, margin: '0px 0px -25% 0px' }}
        onViewportEnter={() => setSeen(true)}
      >
        {children}
      </motion.div>
    </Look.Provider>
  );
}

/** One item of a RevealGroup; `index` is its place in the stagger. */
export function RevealItem({
  index,
  className,
  mark,
  children,
}: {
  index: number;
  className?: string;
  /** Data attributes for the element: the editor's item marker, a lead cell. */
  mark?: DataAttributes;
  children: ReactNode;
}) {
  const look = useContext(Look);
  return (
    <motion.div
      {...mark}
      className={className}
      custom={index}
      variants={variants[look]}
    >
      {children}
    </motion.div>
  );
}
