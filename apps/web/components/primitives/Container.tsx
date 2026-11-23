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
