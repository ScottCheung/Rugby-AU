import type { z } from 'zod';
import type { Item } from '@/lib/components/blocks/roles';
import type { BlockType, blockDefinitions } from '@/lib/components/registry';

type Blocks = (typeof blockDefinitions)[number];

/** A block type's own style options, as its schema declares them. */
export type StyleOf<Type extends BlockType> = z.infer<
  Extract<Blocks, { type: Type }>['style']
>;

/**
 * What a block type's renderer gets for one item: the item and the block's
 * style options, nothing about where the item came from or how the block
 * is laid out (Arrangement draws that).
 */
export type ItemProps<Type extends BlockType> = {
  item: Item;
  style: StyleOf<Type>;
  /** Its place among the drawn items (the first hero is the page's h1). */
  index: number;
  siteSlug: string;
  /** When the page was rendered (ISO): what "upcoming" is measured from. */
  now: string;
};
