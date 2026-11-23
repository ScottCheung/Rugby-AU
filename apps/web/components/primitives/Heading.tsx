import type { ReactNode } from 'react';

/**
 * Sizes follow the page's width (the `page` container on the site wrapper
 * and the editor canvas), not the browser window, so the editor's scaled
 * preview gets the same sizes as a real screen of that width.
 */
const sizes = {
  // A hero's or an article's headline: the only large type.
  1: 'text-4xl leading-[1.05] font-bold tracking-tight @xl/page:text-6xl',
  // A Section's heading.
  2: 'text-3xl leading-[1.15] font-bold @xl/page:text-4xl',
  // A block's own heading (a card, a person), under its Section's heading.
  3: 'text-xl leading-snug font-semibold @xl/page:text-2xl',
  // The title of one item: a card, a person, a match.
  4: 'text-base leading-snug font-semibold @xl/page:text-lg',
} as const;

/**
 * Site heading. Colour is inherited, so it works on any background.
 * `level` is the size; the element is `as`, else the same level. The page
 * title is always the page's one h1 (SitePage), so a hero's headline is
 * level 1 in size but an h2.
 */
export function Heading({
  level,
  as,
  children,
  className = '',
}: {
  level: 1 | 2 | 3 | 4;
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
  className?: string;
}) {
  const Tag = as ?? (`h${level}` as const);
  return (
    <Tag className={`site-heading ${sizes[level]} ${className}`}>
      {children}
    </Tag>
  );
}
