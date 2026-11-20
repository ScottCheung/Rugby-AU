import type { ReactNode } from 'react';
import { Container } from '@/components/primitives/Container';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';

type Props = PropsOf<'section'> & { children?: ReactNode; nested?: boolean };

const colours: Record<Props['background'], string> = {
  none: '',
  light: 'bg-surface-light',
  brand: 'bg-brand text-brand-contrast',
};

// Columns only apply when the section itself is wide enough; narrower,
// everything stacks. Container queries rather than screen breakpoints, so a
// section nested in a column, or the manager's phone preview, lays out by
// the space it really has.
const layouts: Record<Props['layout'], string> = {
  full: 'flex flex-col',
  'two-column': 'grid @2xl:grid-cols-2',
  'two-column-wide': 'grid @2xl:grid-cols-[2fr_1fr]',
  'two-column-wide-right': 'grid @2xl:grid-cols-[1fr_2fr]',
  'three-column': 'grid @2xl:grid-cols-3',
};

/**
 * Width only applies to a Section placed directly on the page (the renderer
 * then leaves it out of the page column). Nested, it follows its parent.
 */
export function Section({
  heading,
  intro,
  layout,
  background,
  width,
  nested = false,
  children,
}: Props) {
  const mode = nested ? 'contained' : width;
  const header = (heading || intro) && (
    <header className="flex max-w-2xl flex-col gap-2">
      {heading && <Heading level={2}>{heading}</Heading>}
      {intro && <p className="text-base leading-relaxed opacity-80">{intro}</p>}
    </header>
  );
  const body = (
    <div className={`gap-site-md ${layouts[layout]}`}>{children}</div>
  );
  const coloured = background !== 'none';

  if (mode === 'contained')
    return (
      <section
        className={`@container flex flex-col gap-site-sm ${colours[background]} ${coloured ? 'rounded-site p-site-md' : ''}`}
      >
        {header}
        {body}
      </section>
    );

  // Full-width: the colour runs to the screen edges. The heading always
  // stays in the page column so it lines up with the rest of the page.
  return (
    <section
      className={`@container flex flex-col gap-site-sm ${colours[background]} ${coloured ? 'py-site-lg' : ''} ${mode === 'full-width' ? 'section-bleed' : ''}`}
    >
      {header && <Container>{header}</Container>}
      {mode === 'full-background' ? <Container>{body}</Container> : body}
    </section>
  );
}
