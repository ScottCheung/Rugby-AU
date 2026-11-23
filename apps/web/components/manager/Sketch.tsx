import type { ReactNode } from 'react';

/**
 * Skeleton pictures for layout options, keyed by the names schemas use in
 * `optionSketches`. Drawn in currentColor so they follow the picker's
 * colour (grey, or the primary colour when selected).
 *
 * Shapes: `img` is a solid block standing for a photo, `line` a thin bar
 * standing for text. Everything sits on a 60 x 40 grid.
 */
/**
 * Marks drawn on a filled shape (text on a photo, dots on a slide): white on
 * a plain card, the primary colour on a chosen (filled) one. See SchemaForm.
 */
const inkOn = { fill: 'var(--sketch-ink, white)' };

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
/**
 * The colour schemes a Section background and a slider indicator share,
 * drawn in the card's own colour so they read on a plain and a chosen card:
 * Primary solid, Secondary a light tint, Glass a faint pane with a lit
 * edge, None just the outline.
 */
type Scheme = 'primary' | 'secondary' | 'glass' | 'none';
const schemeFill = (
  scheme: Scheme,
  shape: { x: number; y: number; w: number; h: number; r: number },
) => {
  const { x, y, w, h, r } = shape;
  const common = { x, y, width: w, height: h, rx: r };
  if (scheme === 'primary') return <rect {...common} />;
  if (scheme === 'secondary') return <rect {...common} opacity={0.28} />;
  if (scheme === 'glass')
    return (
      <rect
        {...common}
        fillOpacity={0.1}
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1}
      />
    );
  return (
    <rect
      {...common}
      fill="none"
      stroke="currentColor"
      strokeDasharray="2.5 2.5"
      strokeOpacity={0.45}
      strokeWidth={1}
    />
  );
};
/** Marks on a scheme: the card's ink on Primary, the card's colour elsewhere. */
const schemeInk = (scheme: Scheme) =>
  scheme === 'primary' ? inkOn : { fill: 'currentColor' };

/** An indicator colour: the pill in that scheme, a dash and two dots on it. */
const pillSketch = (scheme: Scheme): ReactNode => (
  <>
    {schemeFill(scheme, { x: 6, y: 12, w: 48, h: 16, r: 8 })}
    <g style={schemeInk(scheme)}>
      <rect x={18} y={18.6} width={10} height={2.8} rx={1.4} />
      <circle cx={33.5} cy={20} r={1.5} opacity={0.5} />
      <circle cx={39.5} cy={20} r={1.5} opacity={0.5} />
    </g>
  </>
);

/** A Section background: the band in that scheme, a heading and a line on it. */
const bandSketch = (scheme: Scheme): ReactNode => (
  <>
    {schemeFill(scheme, { x: 4, y: 5, w: 52, h: 30, r: 3 })}
    <g style={schemeInk(scheme)}>
      <rect x={11} y={13} width={22} height={4} rx={2} />
      <rect x={11} y={21} width={34} height={2.5} rx={1.25} opacity={0.6} />
      <rect x={11} y={26.5} width={26} height={2.5} rx={1.25} opacity={0.6} />
    </g>
  </>
);

/** A photo: a sky, a sun and two hills, in the card's colour. */
const photo = (
  <>
    <rect x={4} y={5} width={52} height={30} rx={3} opacity={0.35} />
    <circle cx={44} cy={13} r={3.5} opacity={0.7} />
    <path
      d="M4 31 L20 18 L31 27 L39 21 L56 32 L56 32 Q56 35 53 35 L7 35 Q4 35 4 32 Z"
      opacity={0.75}
    />
  </>
);

/** An overlay on a photo, with a heading and a line on top. */
const veilSketch = (veil: Scheme | 'blur'): ReactNode => (
  <>
    {veil === 'blur' ? (
      <>
        <defs>
          <filter id="sketch-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <clipPath id="sketch-clip">
            <rect x={4} y={5} width={52} height={30} rx={3} />
          </clipPath>
        </defs>
        <g clipPath="url(#sketch-clip)">
          <g filter="url(#sketch-blur)">{photo}</g>
        </g>
      </>
    ) : (
      photo
    )}
    {veil === 'primary' && (
      <rect x={4} y={5} width={52} height={30} rx={3} opacity={0.75} />
    )}
    {veil === 'secondary' && (
      <rect
        x={4}
        y={5}
        width={52}
        height={30}
        rx={3}
        style={inkOn}
        opacity={0.7}
      />
    )}
    {veil === 'glass' && (
      <rect
        x={9}
        y={10}
        width={42}
        height={20}
        rx={3}
        style={inkOn}
        fillOpacity={0.35}
        stroke="currentColor"
        strokeOpacity={0.4}
        strokeWidth={0.8}
      />
    )}
    <g style={veil === 'secondary' ? { fill: 'currentColor' } : inkOn}>
      <rect x={13} y={15} width={20} height={3.5} rx={1.75} />
      <rect x={13} y={22} width={30} height={2.5} rx={1.25} opacity={0.75} />
    </g>
  </>
);

/** Where the controls sit: an outlined slide, the mark inside its padding. */
const placeSketch = (x: number): ReactNode => (
  <>
    <rect
      x={3}
      y={4}
      width={54}
      height={32}
      rx={3}
      fill="none"
      stroke="currentColor"
      strokeOpacity={0.35}
      strokeWidth={1.2}
    />
    <rect x={x} y={27} width={14} height={4} rx={2} />
  </>
);

/** Section padding: the content band inside a Section's frame; more padding, less band. */
const padSketch = (gap: number): ReactNode => (
  <>
    <rect
      x={4}
      y={4}
      width={52}
      height={32}
      rx={2}
      fill="none"
      stroke="currentColor"
      strokeDasharray="2 2"
      opacity={0.35}
    />
    <rect
      x={10}
      y={4 + gap}
      width={40}
      height={32 - gap * 2}
      rx={1.5}
      opacity={0.5}
    />
  </>
);

/**
 * Breakout background height: the same person each time, the card behind
 * them taking `share` of the frame's height from the bottom.
 */
const breakoutSketch = (share: number): ReactNode => {
  const top = 4;
  const bottom = 37;
  const y = bottom - (bottom - top) * share;
  return (
    <>
      <rect x={17} y={y} width={26} height={bottom - y} rx={2} opacity={0.35} />
      <circle cx={30} cy={11} r={5.5} opacity={0.6} />
      <rect
        x={21.5}
        y={17.5}
        width={17}
        height={bottom - 17.5}
        rx={4}
        opacity={0.6}
      />
    </>
  );
};

/** Column alignment: a tall and a short column in a frame, placed as chosen. */
const alignSketch = (
  align: 'stretch' | 'start' | 'center' | 'end',
): ReactNode => {
  const frame = { y: 4, h: 32 };
  const short = align === 'stretch' ? frame.h : 14;
  const top =
    align === 'end'
      ? frame.y + frame.h - short
      : align === 'center'
        ? frame.y + (frame.h - short) / 2
        : frame.y;
  return (
    <>
      <rect
        x={4}
        y={4}
        width={52}
        height={32}
        rx={2}
        fill="none"
        stroke="currentColor"
        strokeDasharray="2 2"
        opacity={0.35}
      />
      <rect
        x={8}
        y={frame.y}
        width={20}
        height={frame.h}
        rx={1.5}
        opacity={0.35}
      />
      <rect x={32} y={top} width={20} height={short} rx={1.5} opacity={0.6} />
    </>
  );
};

const sketches: Record<string, ReactNode> = {
  'align-stretch': alignSketch('stretch'),
  'align-start': alignSketch('start'),
  'align-center': alignSketch('center'),
  'align-end': alignSketch('end'),
  // Section background (lib/components/section.ts) and its photo overlay.
  'tone-primary': bandSketch('primary'),
  'tone-secondary': bandSketch('secondary'),
  'tone-glass': bandSketch('glass'),
  'tone-image': (
    <>
      {photo}
      <g style={inkOn}>
        <rect x={11} y={13} width={22} height={4} rx={2} />
      </g>
    </>
  ),
  'tone-none': bandSketch('none'),
  'veil-primary': veilSketch('primary'),
  'veil-secondary': veilSketch('secondary'),
  'veil-glass': veilSketch('glass'),
  'veil-none': veilSketch('none'),
  'veil-blur': veilSketch('blur'),
  'pad-none': padSketch(0),
  'pad-sm': padSketch(4),
  'pad-md': padSketch(8),
  'pad-lg': padSketch(11),
  // One item of each block type: what a single item looks like
  'item-card': (
    <>
      <rect
        x={14}
        y={3}
        width={32}
        height={34}
        rx={2}
        fill="none"
        stroke="currentColor"
        opacity={0.3}
      />
      {img(14, 3, 32, 18)}
      <rect x={17} y={24} width={20} height={3} rx={1.5} opacity={0.6} />
      {line(17, 30, 24)}
    </>
  ),
  'item-overlay': (
    <>
      <rect x={14} y={3} width={32} height={34} rx={2} opacity={0.7} />
      <rect x={17} y={27} width={20} height={3} rx={1.5} style={inkOn} />
      <rect x={17} y={32} width={14} height={2} rx={1} style={inkOn} />
    </>
  ),
  'item-photo': (
    <>
      {img(16, 3, 28, 28)}
      {line(16, 34, 18)}
    </>
  ),
  'item-hero': (
    <>
      {img(2, 4, 56, 32)}
      <rect x={6} y={22} width={24} height={4} rx={2} style={inkOn} />
      <rect
        x={6}
        y={29}
        width={10}
        height={4}
        rx={2}
        style={inkOn}
        opacity={0.8}
      />
    </>
  ),
  'item-text': (
    <>
      <rect x={8} y={8} width={30} height={4} rx={2} opacity={0.6} />
      {line(8, 17, 44)}
      {line(8, 22, 40)}
      {line(8, 27, 42)}
      <rect x={8} y={32} width={12} height={4} rx={2} opacity={0.55} />
    </>
  ),
  'item-stat': (
    <>
      <text x={14} y={25} fontSize={16} fontWeight={700} opacity={0.6}>
        42
      </text>
      {line(14, 30, 26)}
    </>
  ),
  'item-match': (
    <>
      <rect
        x={6}
        y={8}
        width={48}
        height={26}
        rx={2}
        fill="none"
        stroke="currentColor"
        opacity={0.3}
      />
      <circle cx={18} cy={19} r={5} opacity={0.6} />
      <circle cx={42} cy={19} r={5} opacity={0.6} />
      <rect x={26} y={18} width={8} height={2} rx={1} opacity={0.4} />
      {line(12, 28, 36)}
    </>
  ),
  'item-profile': (
    <>
      <rect x={16} y={12} width={28} height={25} rx={2} opacity={0.35} />
      <circle cx={30} cy={11} r={6} opacity={0.6} />
      <rect x={22} y={17} width={16} height={14} rx={4} opacity={0.6} />
      <rect x={19} y={32} width={18} height={2} rx={1} style={inkOn} />
    </>
  ),
  // Breakout background height (lib/components/blocks/people.ts)
  'breakout-40': breakoutSketch(0.4),
  'breakout-50': breakoutSketch(0.5),
  'breakout-60': breakoutSketch(0.6),
  'breakout-70': breakoutSketch(0.7),
  // Block arrangements (lib/components/blocks/layout.ts)
  'arrange-grid': (
    <>
      {card(2, 6, 17, 26)}
      {card(21.5, 6, 17, 26)}
      {card(41, 6, 17, 26)}
    </>
  ),
  'arrange-list': (
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
  'arrange-featured': (
    <>
      {img(3, 4, 34, 24)}
      {line(3, 31, 26)}
      {line(3, 35, 18)}
      {card(40, 4, 17, 15)}
      {card(40, 22, 17, 15)}
    </>
  ),
  'arrange-slider': (
    <>
      {img(2, 4, 56, 28)}
      <rect x={6} y={20} width={22} height={3} rx={1.5} style={inkOn} />
      <rect x={6} y={26} width={14} height={2} rx={1} style={inkOn} />
      <circle cx={25} cy={36} r={1.6} opacity={0.7} />
      <circle cx={30} cy={36} r={1.6} opacity={0.4} />
      <circle cx={35} cy={36} r={1.6} opacity={0.4} />
    </>
  ),
  // Slider indicator (lib/components/blocks/layout.ts): look, colour, place.
  'indicator-pill': (
    <>
      <rect
        x={6}
        y={13}
        width={48}
        height={14}
        rx={7}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeOpacity={0.5}
      />
      <path
        d="M14 17 l-3 3 l3 3 M46 17 l3 3 l-3 3"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x={21} y={18.75} width={8} height={2.5} rx={1.25} />
      <circle cx={33.5} cy={20} r={1.3} opacity={0.4} />
      <circle cx={38} cy={20} r={1.3} opacity={0.4} />
    </>
  ),
  'indicator-dots': (
    <>
      <circle cx={21} cy={20} r={3} />
      <circle cx={30} cy={20} r={3} opacity={0.3} />
      <circle cx={39} cy={20} r={3} opacity={0.3} />
    </>
  ),
  'indicator-bars': (
    <>
      <rect x={8} y={18.5} width={13} height={3} rx={1.5} />
      <rect x={23.5} y={18.5} width={13} height={3} rx={1.5} opacity={0.3} />
      <rect x={39} y={18.5} width={13} height={3} rx={1.5} opacity={0.3} />
    </>
  ),
  'indicator-numbers': (
    <text
      x={30}
      y={24.5}
      textAnchor="middle"
      fontSize={13}
      fontWeight={700}
      fontFamily="system-ui, sans-serif"
    >
      1<tspan opacity={0.4}> / 3</tspan>
    </text>
  ),
  'indicator-theme-primary': pillSketch('primary'),
  'indicator-theme-secondary': pillSketch('secondary'),
  'indicator-theme-glass': pillSketch('glass'),
  'indicator-theme-none': pillSketch('none'),
  'indicator-at-left': placeSketch(9),
  'indicator-at-center': placeSketch(23),
  'indicator-at-right': placeSketch(37),
  'arrange-carousel': (
    <>
      {card(2, 5, 22, 26)}
      {card(27, 5, 22, 26)}
      {/* The next card is cut off at the edge: the row scrolls. */}
      {img(52, 5, 8, 15.6)}
      <circle cx={46} cy={36} r={1.6} opacity={0.5} />
      <circle cx={52} cy={36} r={1.6} opacity={0.5} />
    </>
  ),
  'arrange-wall': (
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

  // Section: how its content sits across the page
  'width-column': (
    <>
      <rect x={0} y={8} width={60} height={24} opacity={0.2} />
      {img(14, 12, 32, 16)}
    </>
  ),
  'width-wide': (
    <>
      <rect x={0} y={8} width={60} height={24} opacity={0.2} />
      {img(5, 12, 50, 16)}
    </>
  ),
  'width-full': (
    <>
      <rect x={0} y={8} width={60} height={24} opacity={0.2} />
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
  'text-headline': (
    <>
      {line(6, 6, 16)}
      <rect x={6} y={11} width={44} height={6} rx={2} opacity={0.6} />
      <rect x={6} y={20} width={30} height={6} rx={2} opacity={0.6} />
      {line(6, 30, 46)}
    </>
  ),
  'text-story': (
    <>
      {line(10, 6, 40)}
      {line(10, 11, 38)}
      {line(10, 16, 40)}
      <rect x={10} y={22} width={22} height={3} rx={1.5} opacity={0.55} />
      {line(10, 29, 40)}
      {line(10, 34, 30)}
    </>
  ),
  'item-story': (
    <>
      <rect x={10} y={4} width={24} height={3} rx={1.5} opacity={0.55} />
      {line(10, 10, 40)}
      {line(10, 14, 36)}
      {img(10, 19, 40, 11)}
      {line(10, 33, 38)}
    </>
  ),
  'piece-paragraph': (
    <>
      {line(10, 12, 40)}
      {line(10, 17, 38)}
      {line(10, 22, 40)}
      {line(10, 27, 26)}
    </>
  ),
  'piece-heading': (
    <>
      <rect x={10} y={13} width={30} height={5} rx={2} opacity={0.6} />
      {line(10, 23, 40)}
      {line(10, 28, 34)}
    </>
  ),
  'piece-image': (
    <>
      {img(10, 7, 40, 22)}
      {line(10, 32, 22)}
    </>
  ),
  'piece-quote': (
    <>
      <rect x={10} y={9} width={2} height={20} rx={1} opacity={0.5} />
      <rect x={15} y={11} width={34} height={4} rx={2} opacity={0.55} />
      <rect x={15} y={18} width={28} height={4} rx={2} opacity={0.55} />
      {line(15, 26, 14)}
    </>
  ),
  'piece-list': (
    <>
      {[11, 19, 27].map((y) => (
        <g key={y}>
          <circle cx={12} cy={y + 1} r={1.5} opacity={0.55} />
          {line(17, y, 30)}
        </g>
      ))}
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
      data-sketch={name}
      fill="currentColor"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {sketches[name]}
    </svg>
  );
}
