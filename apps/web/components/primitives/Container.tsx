import type { ReactNode } from 'react';

/** Centres content and keeps it readable on wide screens. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-site-sm ${className}`}>
      {children}
    </div>
  );
}

/**
 * The page flow for a block in the page column: the column plus the space
 * between blocks. The same for every block type, Sections included, so the
 * rhythm of a page never depends on what a block is or what colour it has.
 * (Full-width blocks skip it: they are bands that sit flush.) Used by the
 * public page and the editor canvas alike.
 */
export function PageColumnBlock({ children }: { children: ReactNode }) {
  return <Container className="py-site-md">{children}</Container>;
}
