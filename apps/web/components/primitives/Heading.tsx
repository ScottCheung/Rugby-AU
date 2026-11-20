import type { ReactNode } from 'react';

const sizes = {
  1: 'text-4xl sm:text-5xl',
  2: 'text-2xl sm:text-3xl',
  3: 'text-lg',
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
