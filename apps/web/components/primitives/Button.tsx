import type { ReactNode } from 'react';

const variants = {
  primary: 'bg-brand text-brand-contrast hover:opacity-90',
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
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-site px-4 py-2 text-sm font-semibold transition ${variants[variant]}`}
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}
