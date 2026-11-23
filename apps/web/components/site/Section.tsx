import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Container } from '@/components/primitives/Container';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { columnCount } from '@/lib/components/section';
import type { RenderContext } from './siteComponents';

type Props = PropsOf<'section'> &
  Pick<RenderContext, 'nodeId' | 'nested' | 'editing'> & {
    /** How many components are inside (drawn as `children`). */
    childCount: number;
    children?: ReactNode;
  };

/*
 * A Section's style is three independent layers. Each one is set by its own
 * option and none of them reads another:
 *
 *   surface  (background)  colour only: background and text colour
 *   padding  (padding)     vertical space inside the section
 *   width    (width)       which column the section and its content use
 *
 * So changing the background never moves the content, and changing the
 * padding never changes the colour. Space *between* Sections is not the
 * Section's job at all: the page flow adds it (RenderTree).
 */

/** Surface: colour only, resolved from the site's theme tokens. */
const surfaces: Record<Props['background'], string> = {
  none: '',
  primary: 'surface-strong bg-brand text-brand-contrast',
  secondary: 'bg-surface-light',
  // A frosted pane: a thin wash of the light surface, blurred, with a lit
  // top edge and a soft shadow instead of a border.
  glass:
    'bg-[color-mix(in_oklch,var(--color-surface-light)_55%,transparent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_12px_32px_-20px_rgb(0_0_0/0.3)] backdrop-blur-xl',
  // The photo and its overlay are layers behind the content (ImageBackdrop).
  image: 'relative isolate overflow-hidden',
};

type Overlay = NonNullable<Props['overlay']>;

/** Over a background photo: the veil, and the text colour that reads on it. */
const overlays: Record<Overlay, { veil: string; text: string }> = {
  primary: {
    veil: 'bg-brand/80',
    text: 'surface-strong text-brand-contrast',
  },
  secondary: { veil: 'bg-surface-light/85', text: '' },
  glass: {
    veil: 'bg-[color-mix(in_oklch,var(--color-deep,#14201b)_30%,transparent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] backdrop-blur-md',
    text: 'surface-strong text-white',
  },
  none: { veil: '', text: 'surface-strong text-white' },
  blur: {
    veil: 'bg-black/35 backdrop-blur-2xl',
    text: 'surface-strong text-white',
  },
};

/** The classes for a Section's surface, with its overlay's text colour. */
function surfaceClass(background: Props['background'], overlay?: Overlay) {
  if (background !== 'image') return surfaces[background];
  return `${surfaces.image} ${overlays[overlay ?? 'primary'].text}`;
}

/** A background photo and its veil, behind the Section's content. */
function ImageBackdrop({
  image,
  overlay = 'primary',
}: {
  image?: Props['backgroundImage'];
  overlay?: Overlay;
}) {
  return (
    <>
      {image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        // No photo chosen yet: the deep colour, so the text still reads.
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-[var(--color-deep,#14201b)]"
        />
      )}
      {overlays[overlay].veil && (
        <span
          aria-hidden
          className={`absolute inset-0 -z-10 ${overlays[overlay].veil}`}
        />
      )}
    </>
  );
}

const paddings = {
  none: '',
  sm: 'py-site-md',
  md: 'py-[calc(var(--spacing-site-md)*1.5)]',
  lg: 'py-[calc(var(--spacing-site-lg)*1.25)]',
} as const;

const aligns: Record<Props['align'], string> = {
  stretch: 'items-stretch',
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
};

// Columns only apply when the Section itself is wide enough; narrower,
// everything stacks. Container queries rather than screen breakpoints, so a
// Section nested in a column, or the editor's phone preview, lays out by
// the room it really has. Blocks fill the columns in order and wrap.
const layouts: Record<Props['columns'], string> = {
  '1': 'grid grid-cols-1',
  '1-1': 'grid @2xl:grid-cols-2',
  '2-1': 'grid @2xl:grid-cols-[2fr_1fr]',
  '1-2': 'grid @2xl:grid-cols-[1fr_2fr]',
  '1-1-1': 'grid @2xl:grid-cols-3',
};

/**
 * A band across the page: the surface runs to the screen edges, and
 * `width` says how the content sits in it:
 *
 *   full-background  in the page column (centred, at most 72rem)
 *   full-padded      across the whole width, side padding = the block gap
 *   full-width       across the whole width, edge to edge
 *
 * Nested in another Section it is just its heading and columns, in the
 * room its parent gives it.
 */
export function Section({
  nodeId,
  nested,
  editing,
  heading,
  intro,
  columns,
  align,
  background,
  backgroundImage,
  overlay,
  width,
  padding,
  childCount: count,
  children,
}: Props) {
  // In the editor, the columns not filled yet show where a block can go.
  const free = editing ? Math.max(0, columnCount(columns) - count) : 0;
  const header = (heading || intro) && (
    <header className="flex max-w-2xl flex-col gap-site-xs">
      {heading && <Heading level={nested ? 3 : 2}>{heading}</Heading>}
      {intro && (
        <p className="m-0 text-lg leading-relaxed opacity-80">{intro}</p>
      )}
    </header>
  );
  const body = (
    <div
      className={`gap-site-md ${layouts[columns]} ${aligns[align]}`}
      // A strip of cards in a one-column Section may reach the screen edges.
      data-bleed={
        nested || columns !== '1'
          ? undefined
          : width === 'full-padded'
            ? 'padded'
            : ''
      }
    >
      {children}
      {Array.from(
        { length: free || (count === 0 && editing ? 1 : 0) },
        (_, index) => (
          <EmptySlot key={index} sectionId={nodeId} index={count + index} />
        ),
      )}
    </div>
  );

  const backdrop = background === 'image' && (
    <ImageBackdrop image={backgroundImage} overlay={overlay} />
  );

  if (nested)
    return (
      <section
        className={`@container flex flex-col gap-site-md ${surfaceClass(background, overlay)} ${background === 'none' ? '' : 'rounded-site p-site-sm'}`}
      >
        {backdrop}
        {header}
        {body}
      </section>
    );

  const base = `@container flex flex-col gap-site-md ${surfaceClass(background, overlay)} ${paddings[padding]}`;
  // Wide: the side padding matches the gap between blocks (site-md), so the
  // space at the page edge reads the same as the space between photos/cards.
  const padded = 'w-full px-site-md';
  return (
    <section
      className={`${base} ${width === 'full-width' ? 'section-bleed' : ''}`}
    >
      {backdrop}
      {/* The heading always lines up with every other Section's heading,
          even when the blocks below reach wider. */}
      {header && <Container>{header}</Container>}
      {width === 'full-background' ? (
        <Container>{body}</Container>
      ) : width === 'full-padded' ? (
        <div className={padded}>{body}</div>
      ) : (
        body
      )}
    </section>
  );
}

/**
 * In the editor only: a column with no block yet. Clicking it asks the
 * editor to add one here (components/preview/LivePreview.tsx).
 */
function EmptySlot({ sectionId, index }: { sectionId: string; index: number }) {
  return (
    <button
      type="button"
      data-add-slot={sectionId}
      data-slot-index={index}
      className="flex h-full min-h-40 flex-col items-center justify-center gap-site-xs rounded-site border-2 border-dashed border-current/25 bg-current/[0.03] p-site-sm text-center hover:border-current/50"
    >
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-full bg-current/10"
      >
        <Plus className="size-5" />
      </span>
      <span className="text-base font-semibold">Add a block</span>
    </button>
  );
}
