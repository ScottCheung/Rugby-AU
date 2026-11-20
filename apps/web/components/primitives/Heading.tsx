import type { ReactNode } from 'react';

/**
 * Sizes follow the page's width (the `page` container on the site wrapper
 * and the editor canvas), not the browser window, so the editor's scaled
 * preview gets the same sizes as a real screen of that width.
 */
const sizes = {
  1: 'text-6xl leading-[0.95] tracking-tight @xl/page:text-7xl',
  2: 'text-4xl @xl/page:text-5xl',
  3: 'text-xl @xl/page:text-2xl',
} as const;

/** Site heading. Colour is inherited, so it works on any background. */
export function Heading({
  level,
  children,
  className = '',
}: {
  level: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={`site-heading font-bold leading-tight ${sizes[level]} ${className}`}
    >
      {children}
    </Tag>
  );
}
