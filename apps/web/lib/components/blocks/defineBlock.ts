import { z } from 'zod';
import type { ComponentDefinition } from '../define';
import { layoutSchema, type Layout } from './layout';
import { canWriteItems, itemSchemaFor, type Item, type Roles } from './roles';
import { sourceIds, sources, sourceFits, type SourceId } from './sources';

/**
 * A block: a list of items, laid out one way, each item drawn the block's
 * way. Its props are three independent parts, one per editor tab:
 *
 *   content  where the items come from: written here, or a data source
 *   layout   how they are arranged (shared by every block, see layout.ts)
 *   style    what one item looks like: this block type's own options
 *
 * A new block type declares only what is its own: the roles its items
 * read, its style options and its defaults. The content and layout parts,
 * the editing form and the arrangement on the page come with it.
 */
export type BlockSpec<Type extends string, Style extends z.ZodObject> = {
  type: Type;
  label: string;
  description: string;
  /** One item, several: "Card", "Cards". */
  itemLabel: string;
  itemsLabel: string;
  /** The skeleton picture in pickers (components/manager/Sketch.tsx). */
  sketch: string;
  roles: Roles;
  style: Style;
  defaults: { layout: Layout; style: z.infer<Style>; items?: Item[] };
  /**
   * How narrow one item can get before the grid wraps (a CSS length), and
   * how many a carousel shows across the page.
   */
  cell?: { min: string; perView: number; max?: string };
};

export type BlockDefinition<
  Type extends string = string,
  Style extends z.ZodObject = z.ZodObject,
> = ComponentDefinition<
  Type,
  z.ZodObject<{
    content: z.ZodType<BlockProps['content']>;
    layout: typeof layoutSchema;
    style: Style;
  }>
> &
  BlockSpec<Type, Style> & {
    kind: 'block';
    /** Data sources this block's items can come from. */
    sources: SourceId[];
    /** Whether items can be written here (a match cannot). */
    writable: boolean;
    itemSchema: z.ZodObject;
    cell: { min: string; perView: number; max?: string };
  };

const sourceLabels = {
  items: 'Written here',
  ...Object.fromEntries(sourceIds.map((id) => [id, sources[id].label])),
};

export function defineBlock<
  const Type extends string,
  Style extends z.ZodObject,
>(spec: BlockSpec<Type, Style>): BlockDefinition<Type, Style> {
  const writable = canWriteItems(spec.roles);
  const fits = sourceIds.filter((id) => sourceFits(sources[id], spec.roles));
  const itemSchema = itemSchemaFor(spec.roles);
  const variants = [
    ...(writable
      ? [
          z.object({
            from: z.literal('items'),
            items: z.array(itemSchema).meta({
              label: spec.itemsLabel,
              itemLabel: spec.itemLabel,
              managed: true,
            }),
          }),
        ]
      : []),
    ...fits.map((id) =>
      z.object({ from: z.literal(id), ...sources[id].query(spec.roles) }),
    ),
  ] as unknown as [z.ZodObject, ...z.ZodObject[]];

  const content = z.discriminatedUnion('from', variants).meta({
    group: 'content',
    label: 'Items come from',
    optionLabels: sourceLabels,
  });
  const schema = z.object({
    content,
    layout: layoutSchema,
    style: spec.style.meta({ group: 'style', label: 'Style' }),
  });

  const firstSource = fits[0];
  return {
    ...spec,
    kind: 'block',
    // The content union is built at run time; its items are typed loosely.
    schema: schema as unknown as BlockDefinition<Type, Style>['schema'],
    acceptsChildren: false,
    sources: fits,
    writable,
    itemSchema,
    cell: spec.cell ?? { min: '15rem', perView: 3 },
    defaultProps: {
      content: writable
        ? { from: 'items', items: spec.defaults.items ?? [] }
        : { from: firstSource, ...sources[firstSource].defaults },
      layout: spec.defaults.layout,
      style: spec.defaults.style,
    } as BlockDefinition<Type, Style>['defaultProps'],
  };
}

/** A block's props, loosely typed for code that handles every block. */
export type BlockProps = {
  content: { from: string; items?: Item[] } & Record<string, unknown>;
  layout: Layout;
  style: Record<string, unknown>;
};
