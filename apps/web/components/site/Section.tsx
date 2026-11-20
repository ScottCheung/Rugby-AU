import type { ReactNode } from 'react';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';

const backgrounds: Record<PropsOf<'section'>['background'], string> = {
  none: '',
  light: 'bg-surface-light rounded-site p-site-md',
  brand: 'bg-brand text-brand-contrast rounded-site p-site-md',
};

// Columns only apply when the section itself is wide enough; narrower,
// everything stacks. Container queries rather than screen breakpoints, so a
// section nested in a column, or the manager's phone preview, lays out by
// the space it really has.
const layouts: Record<PropsOf<'section'>['layout'], string> = {
  full: 'flex flex-col',
  'two-column': 'grid @2xl:grid-cols-2',
  'two-column-wide': 'grid @2xl:grid-cols-[2fr_1fr]',
  'three-column': 'grid @2xl:grid-cols-3',
};

export function Section({
  heading,
  intro,
  layout,
  background,
  children,
}: PropsOf<'section'> & { children?: ReactNode }) {
  return (
    <section
      className={`@container flex flex-col gap-site-sm ${backgrounds[background]}`}
    >
      {(heading || intro) && (
        <header className="flex max-w-2xl flex-col gap-2">
          {heading && <Heading level={2}>{heading}</Heading>}
          {intro && (
            <p className="text-base leading-relaxed opacity-80">{intro}</p>
          )}
        </header>
      )}
      <div className={`gap-site-md ${layouts[layout]}`}>{children}</div>
    </section>
  );
}
