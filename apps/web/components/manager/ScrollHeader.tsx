'use client';

import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { ProgressiveBlur } from '@scottcheung/ui';

/** Scrolling this far (px) moves the header from its open to its compact layout. */
const RANGE: [number, number] = [0, 200];
/** Space between the title and the toolbar, in px. */
const GAP = 16;

/**
 * The dashboard's page header, after the AFL dashboards' PageHeader and
 * ScrollLayout. At the top of the page the title sits above a full-width
 * toolbar; as the page scrolls the title shrinks a little and the toolbar
 * slides up beside it, so the header ends as one compact row. Content that
 * scrolls under it fades into a progressive blur tinted with the page
 * colour, instead of being cut off at a hard edge.
 *
 * The original measured a scroll container; the manager scrolls the
 * window, so this measures the header row itself.
 */
export function ScrollHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  /** The toolbar: search and actions. */
  children?: ReactNode;
}) {
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, RANGE, [0, 1], { clamp: true });
  const rowY = useTransform(progress, [0, 1], [-40, 0]);
  const rowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-30 md:top-0"
    >
      {/* Background: the page colour fading out over a progressive blur. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150px]">
        <div className="h-[150px] bg-gradient-to-b from-[var(--ui-bg)] from-20% to-transparent" />
        <ProgressiveBlur
          steps={5}
          strength={24}
          side="top"
          style={{ zIndex: -1 }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-4 pb-4 sm:px-8 md:pt-14">
        <motion.div
          ref={rowRef}
          style={{ y: rowY }}
          className="relative flex w-full items-center gap-4"
        >
          <TopToLeft progress={progress} innerRef={titleRef}>
            <h1 className="sc-ui-typography sc-ui-h1 pb-1 text-[var(--ui-primary)]">
              {title}
            </h1>
            {description && (
              <p className="m-0 mt-1 hidden text-sm text-[var(--ui-muted)] lg:block">
                {description}
              </p>
            )}
          </TopToLeft>
          {children && (
            <BtmToRight progress={progress} rowRef={rowRef} titleRef={titleRef}>
              {children}
            </BtmToRight>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}

/** The title: drops 30px at the top of the page and shrinks to 90% as it scrolls. */
function TopToLeft({
  progress,
  innerRef,
  children,
}: {
  progress: MotionValue<number>;
  innerRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const y = useTransform(progress, [0, 1], [30, 0]);
  const scale = useTransform(progress, [0, 1], [1, 0.9]);
  return (
    <div ref={innerRef} className="shrink-0">
      <motion.div style={{ y, scale, transformOrigin: 'left center' }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * The toolbar: at the top of the page it sits under the title at the full
 * width of the row; scrolled, beside the title in the space that is left.
 * Positions are measured, and kept up to date as either part resizes.
 */
function BtmToRight({
  progress,
  rowRef,
  titleRef,
  children,
}: {
  progress: MotionValue<number>;
  rowRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const width = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const row = rowRef.current;
    const titleBox = titleRef.current;
    if (!row || !titleBox) return;
    let start = { width: 0, x: 0, y: 0 };
    let endWidth = 0;
    const apply = (p: number) => {
      width.set(start.width + (endWidth - start.width) * p);
      x.set(start.x * (1 - p));
      y.set(start.y * (1 - p));
    };
    const measure = () => {
      const rowWidth = row.getBoundingClientRect().width;
      const titleRect = titleBox.getBoundingClientRect();
      start = {
        width: rowWidth,
        x: -(titleRect.width + GAP),
        y: titleRect.height + 40,
      };
      endWidth = Math.max(0, rowWidth - titleRect.width - GAP);
      apply(progress.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(titleBox);
    const unsubscribe = progress.on('change', apply);
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [progress, rowRef, titleRef, width, x, y]);

  return (
    <motion.div style={{ x, y, width }} className="flex">
      {children}
    </motion.div>
  );
}
