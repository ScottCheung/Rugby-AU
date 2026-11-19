import type { ReactNode } from 'react';
import { Typography } from '@scottcheung/ui';
import { cn } from '@/lib/utils';

/** Themed heading: font and colour come from the site's CSS variables. */
export function Heading({
  level,
  children,
  className,
}: {
  level: 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Typography
      as={level === 2 ? 'h2' : 'h3'}
      className={cn('block-heading-text', className)}
    >
      {children}
    </Typography>
  );
}
