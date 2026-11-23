import type { CSSProperties, ReactNode } from 'react';
import type { Layout } from '@/lib/components/blocks/layout';
import type { ItemMark } from '@/lib/components/items';
import { Carousel } from '../Carousel';
import { RevealGroup, RevealItem } from '../Reveal';
import { Slider } from './Slider';
import { Wall } from './Wall';

/** One item, drawn, with the editor's marker for it. */
export type Cell = { key: string; mark: ItemMark; node: ReactNode };

/**
 * Lays out a block's items. The only place the arrangements are
 * implemented, for every block type: an item is drawn into a cell and
 * never knows where the cell sits. A cell is a size container, so an item
 * can adapt to the room it gets (a card in a list puts its photo beside
 * the text).
 *
 * The block type only tunes sizes: how narrow a cell may get (`min`), the
 * widest it should be (`max`) and how many a carousel shows (`perView`).
 * Each arrangement is one case below and one rule set in app/styles/site/arrangements.css
 * (`.arrange-*`).
 */
export function Arrangement({
  layout,
  cells,
  size,
  label,
  editing,
  animate,
}: {
  layout: Layout;
  cells: Cell[];
  size: { min: string; perView: number; max?: string };
  /** The carousel's accessible name, e.g. "Cards". */
  label: string;
  editing: boolean;
  /**
   * The items stagger in once, as a group, when the block scrolls into
   * view; each arrangement has its own look (staggerIn in the ui motion
   * presets).
   */
  animate: boolean;
}) {
  const vars = {
    '--cell-min': size.min,
    '--per-view': String(size.perView),
    ...(size.max ? { '--cell-max': size.max } : {}),
  } as CSSProperties;
  // In Featured, the first item is the lead: an item can style itself for
  // that ([data-lead] in app/styles/site/cards.css).
  const lead = layout.arrange === 'featured';
  const cell = ({ key, mark, node }: Cell, index: number, extra = '') => {
    const data = { ...mark, 'data-lead': lead && index === 0 ? '' : undefined };
    const className = `arrange-cell ${extra}`;
    return animate ? (
      <RevealItem key={key} mark={data} index={index} className={className}>
        {node}
      </RevealItem>
    ) : (
      <div key={key} {...data} className={className}>
        {node}
      </div>
    );
  };
  const all = (className: string, attrs: object = {}) => (
    <div className={className} {...attrs}>
      {cells.map((one, index) => cell(one, index))}
    </div>
  );

  let body: ReactNode;
  switch (layout.arrange) {
    case 'grid':
      body = all(
        'arrange-grid',
        perRowAttrs(layout.perRow, layout.perRowNarrow),
      );
      break;
    case 'list':
      body = all('arrange-list');
      break;
    case 'featured':
      body = all('arrange-featured');
      break;
    case 'wall':
      body = <Wall items={cells.map((one, index) => cell(one, index))} />;
      break;
    case 'carousel':
      body = (
        <Carousel label={label}>
          {layout.rows === '2'
            ? // Two rows: the strip scrolls columns of two.
              Array.from(
                { length: Math.ceil(cells.length / 2) },
                (_, column) => (
                  <div key={column} className="arrange-strip arrange-pair">
                    {cells
                      .slice(column * 2, column * 2 + 2)
                      .map((one, index) => cell(one, column * 2 + index))}
                  </div>
                ),
              )
            : cells.map((one, index) => cell(one, index, 'arrange-strip'))}
        </Carousel>
      );
      break;
    case 'slider':
      body = (
        <Slider
          label={label}
          // Never while editing: a moving page is hard to point at.
          autoplay={!!layout.autoplay && !editing}
          indicator={layout.indicator ?? 'pill'}
          theme={layout.indicatorTheme ?? 'secondary'}
          position={layout.indicatorPosition ?? 'right'}
          cells={cells}
        />
      );
      break;
  }

  // The slider staggers its caption in CSS, on every slide change; the
  // group only tells it when the block first comes into view.
  return animate ? (
    <RevealGroup
      look={layout.arrange}
      className="@container min-w-0"
      style={vars}
    >
      {body}
    </RevealGroup>
  ) : (
    <div className="@container min-w-0" style={vars}>
      {body}
    </div>
  );
}

/**
 * Attributes for a grid whose cards per row the editor chose: the counts
 * go in CSS variables, read by app/styles/site/arrangements.css. Nothing when not chosen.
 */
function perRowAttrs(
  perRow?: string,
  perRowNarrow?: string,
): { 'data-per-row'?: string; style?: Record<string, string> } {
  if (!perRow && !perRowNarrow) return {};
  return {
    'data-per-row': '',
    style: {
      '--per-row': perRow ?? '3',
      '--per-row-narrow': perRowNarrow ?? '1',
    },
  };
}
