import type { ReactNode } from 'react';

/**
 * Skeleton pictures for layout options, keyed by the names schemas use in
 * `optionSketches`. Drawn in currentColor so they follow the picker's
 * colour (grey, or the primary colour when selected).
 *
 * Shapes: `img` is a solid block standing for a photo, `line` a thin bar
 * standing for text. Everything sits on a 60 x 40 grid.
 */
const img = (x: number, y: number, w: number, h: number) => (
  <rect x={x} y={y} width={w} height={h} rx={1.5} opacity={0.55} />
);
const line = (x: number, y: number, w: number) => (
  <rect x={x} y={y} width={w} height={2} rx={1} opacity={0.3} />
);
/** A card: photo on top, two lines of text under it. */
const card = (x: number, y: number, w: number, h: number) => (
  <>
    {img(x, y, w, h * 0.6)}
    {line(x, y + h * 0.6 + 3, w * 0.8)}
    {line(x, y + h * 0.6 + 7, w * 0.55)}
  </>
);
/** The page column (dashed) inside the full width of the screen. */
const column = (
  <rect
    x={8}
    y={2}
    width={44}
    height={36}
    rx={2}
    fill="none"
    stroke="currentColor"
    strokeDasharray="2 2"
    opacity={0.35}
  />
);

const sketches: Record<string, ReactNode> = {
  // Card Grid: how the cards are arranged
  grid: (
    <>
      {card(2, 6, 17, 26)}
      {card(21.5, 6, 17, 26)}
      {card(41, 6, 17, 26)}
    </>
  ),
  list: (
    <>
      {[3, 15, 27].map((y) => (
        <g key={y}>
          {img(4, y, 16, 10)}
          {line(23, y + 2, 26)}
          {line(23, y + 6, 18)}
        </g>
      ))}
    </>
  ),
  featured: (
    <>
      {img(3, 4, 34, 24)}
      {line(3, 31, 26)}
      {line(3, 35, 18)}
      {card(40, 4, 17, 15)}
      {card(40, 22, 17, 15)}
    </>
  ),
  overlay: (
    <>
      {[2, 21.5, 41].map((x) => (
        <g key={x}>
          <rect x={x} y={5} width={17} height={30} rx={1.5} opacity={0.7} />
          <rect x={x + 2} y={26} width={11} height={2} rx={1} fill="white" />
          <rect x={x + 2} y={30} width={8} height={2} rx={1} fill="white" />
        </g>
      ))}
    </>
  ),
  carousel: (
    <>
      {card(2, 5, 22, 26)}
      {card(27, 5, 22, 26)}
      {/* The next card is cut off at the edge: the row scrolls. */}
      {img(52, 5, 8, 15.6)}
      <circle cx={46} cy={36} r={1.6} opacity={0.5} />
      <circle cx={52} cy={36} r={1.6} opacity={0.5} />
    </>
  ),
  masonry: (
    <>
      {img(3, 3, 17, 14)}
      {img(3, 19, 17, 18)}
      {img(21.5, 3, 17, 22)}
      {img(21.5, 27, 17, 10)}
      {img(40, 3, 17, 10)}
      {img(40, 15, 17, 22)}
    </>
  ),

  // Section: how blocks inside are laid out
  'one-column': img(6, 6, 48, 28),
  'two-column': (
    <>
      {img(4, 6, 25, 28)}
      {img(31, 6, 25, 28)}
    </>
  ),
  'two-column-wide': (
    <>
      {img(4, 6, 33, 28)}
      {img(39, 6, 17, 28)}
    </>
  ),
  'two-column-wide-right': (
    <>
      {img(4, 6, 17, 28)}
      {img(23, 6, 33, 28)}
    </>
  ),
  'three-column': (
    <>
      {img(3, 6, 17, 28)}
      {img(21.5, 6, 17, 28)}
      {img(40, 6, 17, 28)}
    </>
  ),

  // Section: how wide it is on the page
  contained: (
    <>
      {column}
      {img(11, 12, 38, 16)}
    </>
  ),
  'full-background': (
    <>
      {column}
      <rect x={0} y={10} width={60} height={20} opacity={0.25} />
      {img(11, 14, 38, 12)}
    </>
  ),
  'full-width': (
    <>
      {column}
      {img(0, 12, 60, 16)}
    </>
  ),

  // Text: style
  'text-plain': (
    <>
      <rect x={6} y={7} width={26} height={4} rx={1.5} opacity={0.55} />
      {line(6, 16, 46)}
      {line(6, 21, 42)}
      {line(6, 26, 30)}
    </>
  ),
  'text-centered': (
    <>
      <rect x={17} y={7} width={26} height={4} rx={1.5} opacity={0.55} />
      {line(7, 16, 46)}
      {line(9, 21, 42)}
      {line(15, 26, 30)}
    </>
  ),
  'text-quote': (
    <>
      <text
        x={30}
        y={16}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        opacity={0.55}
      >
        “
      </text>
      <rect x={10} y={19} width={40} height={3} rx={1.5} opacity={0.45} />
      <rect x={14} y={25} width={32} height={3} rx={1.5} opacity={0.45} />
      {line(22, 32, 16)}
    </>
  ),
};

/** True when there is a picture for this name. */
export const hasSketch = (name?: string): name is string =>
  name !== undefined && name in sketches;

export function Sketch({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden
      fill="currentColor"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {sketches[name]}
    </svg>
  );
}
