import type { ReactNode } from 'react';
import { Container } from '@/components/primitives/Container';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { sectionPadding } from '@/lib/components/section';

type Props = PropsOf<'section'> & { children?: ReactNode; nested?: boolean };

/*
 * A Section's style is three independent layers. Each one is set by its own
 * option and none of them reads another:
 *
 *   surface  (Background)  colour only: background and text colour
 *   padding  (Padding)     vertical space inside the section
 *   width    (Width)       which column the section and its content use
 *
 * So changing the background never moves the content, and changing the
 * padding never changes the colour. Space *between* page blocks is not the
 * Section's job at all: the page flow adds it (RenderTree).
 */

/** Surface: colour only. */
const surfaces: Record<Props['background'], string> = {
  none: '',
  light: 'bg-surface-light',
  brand: 'surface-strong bg-brand text-brand-contrast',
};

/** Padding: vertical space inside the section only. */
const paddings = {
  none: '',
  sm: 'py-site-sm',
  md: 'py-site-md',
  lg: 'py-site-lg',
} as const;

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
  padding,
  nested = false,
  children,
}: Props) {
  const mode = nested ? 'contained' : width;
  const header = (heading || intro) && (
    <header className="flex max-w-2xl flex-col gap-2">
      {heading && <Heading level={2}>{heading}</Heading>}
      {intro && <p className="text-xl leading-relaxed opacity-80">{intro}</p>}
    </header>
  );
  const body = (
    <div className={`gap-site-md ${layouts[layout]}`}>{children}</div>
  );
  const base = `@container flex flex-col gap-site-sm ${surfaces[background]} ${paddings[sectionPadding({ padding, width: mode })]}`;

  // In the page column. A coloured surface becomes a panel (globals.css,
  // .section-panel): it pads its sides and, on the page, reaches out by the
  // same amount, so the content stays on the page column either way.
  if (mode === 'contained')
    return (
      <section
        className={`${base} ${background === 'none' ? '' : nested ? 'section-panel' : 'section-panel section-panel--bleed'}`}
      >
        {header}
        {body}
      </section>
    );

  // Full-width: the surface runs to the screen edges. The heading always
  // stays in the page column so it lines up with the rest of the page.
  return (
    <section
      className={`${base} ${mode === 'full-width' ? 'section-bleed' : ''}`}
    >
      {header && <Container>{header}</Container>}
      {mode === 'full-background' ? <Container>{body}</Container> : body}
    </section>
  );
}
