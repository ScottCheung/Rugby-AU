import { z } from 'zod';
import '../editorMeta';

/**
 * How a block lays out its items, whatever they are. Six arrangements,
 * each a shape of its own with only its own options, so choosing one never
 * leaves options of another behind. Every block type can use any of them,
 * and an item never knows which one it is in.
 *
 *   grid      side by side in rows, as many per row as fit (or as chosen)
 *   list      one under another, one per row
 *   featured  the first one large, the rest beside and below it
 *   wall      columns where each item keeps its own height (a photo wall)
 *   carousel  several at once in a strip that scrolls sideways
 *   slider    one at a time, with dots (a hero banner, rotating quotes)
 */
const grid = z.object({
  arrange: z.literal('grid'),
  perRow: z
    .enum(['2', '3', '4', '5'])
    .optional()
    .meta({
      label: 'Per row',
      emptyLabel: 'Auto',
      hint: 'Auto: as many as fit the space the block has.',
      optionLabels: { '2': '2', '3': '3', '4': '4', '5': '5' },
    }),
  perRowNarrow: z
    .enum(['2'])
    .optional()
    .meta({
      label: 'Per row on phones',
      emptyLabel: 'One',
      optionLabels: { '2': 'Two' },
    }),
});
const list = z.object({ arrange: z.literal('list') });
const featured = z.object({ arrange: z.literal('featured') });
const wall = z.object({ arrange: z.literal('wall') });
const carousel = z.object({
  arrange: z.literal('carousel'),
  rows: z
    .enum(['2'])
    .optional()
    .meta({
      label: 'Rows',
      emptyLabel: 'One row',
      optionLabels: { '2': 'Two rows' },
    }),
});
const slider = z.object({
  arrange: z.literal('slider'),
  autoplay: z.boolean().optional().meta({
    label: 'Move on by itself',
    hint: 'Never in the editor, and never for visitors who prefer less motion.',
  }),
  // The controls: their look, colours and place. Absent is the original
  // (a pill with arrows and dots, Secondary, on the right), so older pages keep it.
  indicator: z
    .enum(['pill', 'dots', 'bars', 'numbers'])
    .optional()
    .meta({
      label: 'Indicator',
      emptyIs: 'pill',
      optionLabels: {
        pill: 'Pill',
        dots: 'Dots',
        bars: 'Bars',
        numbers: 'Numbers',
      },
      optionSketches: {
        pill: 'indicator-pill',
        dots: 'indicator-dots',
        bars: 'indicator-bars',
        numbers: 'indicator-numbers',
      },
    }),
  // The same colours, names and order as a Section's background.
  indicatorTheme: z
    .enum(['primary', 'secondary', 'glass', 'none'])
    .optional()
    .meta({
      label: 'Indicator colour',
      emptyIs: 'secondary',
      optionLabels: {
        primary: 'Primary',
        secondary: 'Secondary',
        glass: 'Glass',
        none: 'None',
      },
      optionSketches: {
        primary: 'indicator-theme-primary',
        secondary: 'indicator-theme-secondary',
        glass: 'indicator-theme-glass',
        none: 'indicator-theme-none',
      },
    }),
  indicatorPosition: z
    .enum(['left', 'center', 'right'])
    .optional()
    .meta({
      label: 'Indicator position',
      hint: 'Lines up with the slide content, never at the very edge.',
      emptyIs: 'right',
      optionLabels: { left: 'Left', center: 'Centre', right: 'Right' },
      optionSketches: {
        left: 'indicator-at-left',
        center: 'indicator-at-center',
        right: 'indicator-at-right',
      },
    }),
});

export const arrangements = {
  grid: 'Grid',
  list: 'List',
  featured: 'Featured',
  wall: 'Wall',
  carousel: 'Carousel',
  slider: 'Slider',
} as const;

export const layoutSchema = z
  .discriminatedUnion('arrange', [grid, list, featured, wall, carousel, slider])
  .meta({
    group: 'layout',
    label: 'Laid out as',
    optionLabels: arrangements,
    // Each arrangement is picked by its picture (components/manager/Sketch.tsx).
    optionSketches: Object.fromEntries(
      Object.keys(arrangements).map((id) => [id, `arrange-${id}`]),
    ),
  });

export type Layout = z.infer<typeof layoutSchema>;
export type Arrange = Layout['arrange'];
