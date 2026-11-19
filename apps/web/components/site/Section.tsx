import type { ReactNode } from 'react';
import type { PropsOf } from '@/lib/components/registry';

const backgrounds: Record<PropsOf<'section'>['background'], string> = {
  none: '',
  light: 'bg-surface-light rounded-site p-site-md',
  brand: 'bg-brand text-brand-contrast rounded-site p-site-md',
};

const layouts: Record<PropsOf<'section'>['layout'], string> = {
  full: 'flex flex-col',
  // Side by side on desktop, stacked on mobile.
  'two-column': 'grid md:grid-cols-2',
};

export function Section({
  layout,
  background,
  children,
}: PropsOf<'section'> & { children?: ReactNode }) {
  return (
    <section className={backgrounds[background]}>
      <div className={`gap-site-md ${layouts[layout]}`}>{children}</div>
    </section>
  );
}
