import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

const variants = {
  // Colours from the surface it sits on (app/styles/site/base.css), so it
  // never takes the same colour as a brand Section or a hero's fade.
  primary: 'site-button hover:opacity-90',
  outline: 'border-2 border-current hover:bg-current/10',
} as const;

/**
 * A link that looks like a button. Public pages are server-rendered and
 * their "buttons" navigate, so this is always an <a>.
 */
export function Button({
  href,
  children,
  variant = 'primary',
  stretched = false,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  /**
   * Make the link cover its nearest positioned ancestor, so a whole card is
   * clickable while the page still has one link per card.
   */
  stretched?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-site px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${
        stretched ? 'stretched-link' : ''
      }`}
    >
      {children}
      <ChevronRight aria-hidden className="-mr-1 size-4" />
    </a>
  );
}
