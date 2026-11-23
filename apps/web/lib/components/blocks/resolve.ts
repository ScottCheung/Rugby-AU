import type { SiteData } from './siteData';
import type { ItemRef } from '../items';
import { fillMissing } from '../placeholders';
import type { BlockDefinition, BlockProps } from './defineBlock';
import type { Item } from './roles';
import { sourceOf } from './sources';

/** One item as drawn: what it says, and how the editor points at it. */
export type DrawnItem = {
  key: string;
  /** `items[index]` for written items, the source's id for the others. */
  ref: ItemRef;
  item: Item;
  hidden: boolean;
};

/**
 * The items a block draws, in order. Visitors get the visible ones; the
 * editor gets every one, hidden ones marked, and written items missing a
 * required field filled with a placeholder. Shared by the public page,
 * the editor's preview and its Layers tree, so all three always agree.
 */
export function blockItems(
  definition: BlockDefinition,
  props: BlockProps,
  data: SiteData,
  editing: boolean,
): DrawnItem[] {
  const { content } = props;
  // A background photo's colour, worked out on the server before render.
  const tinted = (item: Item): Item => {
    const url = tintSource(definition, item);
    const tint = url && data.colors[url];
    return tint ? { ...item, tint } : item;
  };
  if (content.from === 'items')
    return (content.items ?? []).flatMap((item, index) => {
      const hidden = !!item.hidden;
      if (hidden && !editing) return [];
      return [
        {
          key: `i${index}`,
          ref: { field: 'items', index },
          item: tinted(
            editing ? fillMissing(item, definition.roles).item : item,
          ),
          hidden,
        },
      ];
    });
  const source = sourceOf(content.from);
  if (!source) return [];
  return source.items(content, data, editing).map(({ ref, item, hidden }) => ({
    key: `r${ref}`,
    ref: { field: 'source', ref },
    item: tinted(item),
    hidden,
  }));
}

/**
 * The photo an item's colour is picked from: a person's background, or a
 * card's own photo (the colour its text-on-photo overlay fades up in).
 */
export function tintSource(
  definition: BlockDefinition,
  item: Item,
): string | undefined {
  if (item.background) return item.background.url;
  if (definition.type === 'cards') return item.image?.url || undefined;
  return undefined;
}
