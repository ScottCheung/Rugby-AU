import type { ComponentNode } from '../types';
import { splitLayout } from './splitLayouts';

/**
 * Pages stored before blocks were components of their own: a Section held
 * `column` nodes, and one column type did everything through a flat bag
 * of props (source, style, arrange, perRow, ratio, team...). This turns
 * such a tree into the current one, keeping ids, text and images:
 *
 *   section { tone, columns } > column      section { background } > block
 *
 * Each column becomes the block type its style (or source) drew, with its
 * props split into content / layout / style. Empty columns are dropped:
 * the Section still has its columns, and blocks fill them in order.
 *
 * Pure and idempotent: a tree with no columns comes back unchanged (the
 * same object), so it is safe to run on any stored page.
 */
export function blocksFromColumns(tree: ComponentNode[]): ComponentNode[] {
  if (!tree.some(needsUpgrade)) return tree;
  return tree.map(upgradeNode);
}

function needsUpgrade(node: ComponentNode): boolean {
  return (
    node.type === 'column' ||
    (node.type === 'section' && 'tone' in node.props) ||
    (node.children ?? []).some(needsUpgrade)
  );
}

function upgradeNode(node: ComponentNode): ComponentNode {
  if (node.type !== 'section') return node;
  const { tone, ...props } = node.props;
  return {
    ...node,
    props: { ...props, background: props.background ?? tone ?? 'none' },
    children: (node.children ?? []).flatMap((child) =>
      child.type === 'column' ? blocksOf(child) : [upgradeNode(child)],
    ),
  };
}

type Props = Record<string, unknown>;

const defined = (props: Props) =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  );

/**
 * Arrangements stored before there were only two: single and stack were
 * one per row, featured had the first card large, masonry and row were
 * grids, slides was one slide at a time.
 */
const olderArrange: Record<string, Props> = {
  single: { arrange: 'grid', perRow: '1' },
  stack: { arrange: 'grid', perRow: '1' },
  featured: { arrange: 'grid', featured: true },
  masonry: { arrange: 'grid' },
  row: { arrange: 'grid' },
  slides: { arrange: 'carousel', oneAtATime: true },
};

/** The arrangement and its options, from a column's flat props. */
function layoutOf(stored: Props, oneAtATime = false): Props {
  return splitLayout(twoArrangements(stored, oneAtATime));
}

/** As layouts were stored with two arrangements (see splitLayouts.ts). */
function twoArrangements(stored: Props, oneAtATime: boolean): Props {
  const older = olderArrange[String(stored.arrange)];
  const column = older ? { ...stored, ...older } : stored;
  if (older?.oneAtATime) oneAtATime = true;
  if (column.arrange === 'carousel')
    return defined({
      arrange: 'carousel',
      perView: oneAtATime ? 'one' : 'several',
      rows: !oneAtATime && column.rows === 'two' ? '2' : undefined,
      autoplay: oneAtATime && column.autoplay ? true : undefined,
    });
  return defined({
    arrange: 'grid',
    perRow: column.perRow,
    perRowNarrow: column.perRowNarrow,
    featured: column.featured || undefined,
  });
}

const cardStyle = (column: Props) => ({
  look: column.style === 'overlay' ? 'overlay' : 'card',
  ratio: column.ratio ?? 'wide',
  showText: column.showText ?? true,
});

const pick = (column: Props, keys: string[]) =>
  defined(Object.fromEntries(keys.map((key) => [key, column[key]])));

function blocksOf(column: ComponentNode): ComponentNode[] {
  const p = column.props;
  const block = (type: string, props: Props, id = column.id) => ({
    id,
    type,
    props,
  });
  const items = { from: 'items', items: p.items ?? [] };

  switch (p.source) {
    case 'manual':
      switch (p.style) {
        case 'text':
          return [
            block('text', {
              content: items,
              layout: layoutOf(p),
              style: { variant: p.variant ?? 'plain' },
            }),
          ];
        case 'hero':
          return [
            block('hero', {
              content: items,
              layout: layoutOf(p, true),
              style: { height: 'tall' },
            }),
          ];
        case 'card':
        case 'overlay':
          return [
            block('cards', {
              content: items,
              layout: layoutOf(p),
              style: cardStyle(p),
            }),
          ];
        case 'photo':
          return [
            block('photos', {
              content: items,
              // A grid of photos was a wall: each kept its own shape.
              layout:
                p.arrange === 'carousel' || p.arrange === 'slides'
                  ? layoutOf(p)
                  : { arrange: 'wall' },
              style: { caption: true },
            }),
          ];
        case 'stat':
          return [
            block('stats', {
              content: items,
              layout: layoutOf(p),
              style: { size: p.statSize ?? 'l' },
            }),
          ];
        case 'profile':
          return [
            block('people', {
              content: items,
              layout: layoutOf(p),
              style: {},
            }),
          ];
        default:
          return [];
      }
    case 'news':
      return [
        block('cards', {
          content: {
            from: 'news',
            mode: p.mode ?? 'latest',
            limit: p.limit ?? 3,
            ...pick(p, ['category', 'picked', 'hidden']),
          },
          layout: layoutOf(p),
          style: cardStyle(p),
        }),
      ];
    case 'players':
      return [
        block('people', {
          content: {
            from: 'players',
            mode: p.mode ?? 'latest',
            ...pick(p, ['group', 'limit', 'picked', 'hidden']),
          },
          layout: layoutOf(p),
          style: {},
        }),
      ];
    case 'fixtures':
      return [
        block('matches', {
          content: {
            from: 'fixtures',
            show: p.show ?? 'both',
            limit: p.limit ?? 4,
            ...pick(p, ['team', 'hidden']),
          },
          // Matches used to stack, one per row, unless told otherwise.
          layout: layoutOf(p.arrange ? p : { ...p, arrange: 'stack' }),
          style: { showVenue: p.showVenue ?? true },
        }),
      ];
    case 'entry':
      // The news template's one packed Article becomes ordinary blocks,
      // each bound to the article's fields.
      return articleTemplateBlocks(column.id);
    default:
      // Empty, or an old embedded article (articles are entries now).
      return [];
  }
}

/**
 * The blocks of the news template: the headline, the photo and the story,
 * each bound to the article's fields. Ids are derived, so running this
 * twice gives the same tree.
 */
function articleTemplateBlocks(id: string): ComponentNode[] {
  return [
    {
      id: `${id}-headline`,
      type: 'text',
      props: {
        content: { from: 'entry', title: 'headline', text: 'standfirst' },
        layout: { arrange: 'list' },
        style: { variant: 'headline' },
      },
    },
    {
      id: `${id}-photo`,
      type: 'photos',
      props: {
        content: { from: 'entry', image: 'image', title: 'headline' },
        layout: { arrange: 'list' },
        style: { caption: false },
      },
    },
    {
      id: `${id}-story`,
      type: 'text',
      props: {
        content: { from: 'entry', text: 'body' },
        layout: { arrange: 'list' },
        style: { variant: 'story' },
      },
    },
  ];
}
