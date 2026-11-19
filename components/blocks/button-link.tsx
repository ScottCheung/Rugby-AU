import type { ReactNode } from 'react';

/**
 * A link styled as a @scottcheung/ui Button. Rendered as <a> so it works in
 * server-rendered pages without client JS; colours come from --ui-* tokens.
 */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <a className="sc-ui-button" data-variant={variant} data-size={size} href={href}>
      {children}
    </a>
  );
}
