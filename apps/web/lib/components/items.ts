/**
 * An item of a block: a written one by its place in `content.items`
 * (`field: 'items'`), or one a data source fills in by its id
 * (`field: 'source'`, an article's slug, a match's id). The editor selects
 * and hides them; the public site leaves hidden ones out.
 */
export type ItemRef =
  { field: string; index: number } | { field: string; ref: string };

export function sameItem(a: ItemRef | null, b: ItemRef | null): boolean {
  if (!a || !b) return a === b;
  if (a.field !== b.field) return false;
  if ('index' in a && 'index' in b) return a.index === b.index;
  if ('ref' in a && 'ref' in b) return a.ref === b.ref;
  return false;
}

/** `data-*` attributes, set on an element as they are. */
export type DataAttributes = Record<`data-${string}`, string | undefined>;

/** Data attributes that mark an item for the editor's preview. */
export type ItemMark = Record<`data-item-${string}`, string | undefined>;

/**
 * The attributes for one item, set on the item's own root element (never
 * a wrapper, so CSS such as `.cards-list > article` matches exactly as on
 * the live site). Empty for visitors.
 */
export function itemMark({
  editing,
  field,
  index,
  ref,
  hidden = false,
}: {
  editing: boolean;
  /** The list prop the item comes from, e.g. "cards". */
  field: string;
  /** Its place in that list... */
  index?: number;
  /** ...or its id, for items the component fills in itself. */
  ref?: string;
  hidden?: boolean;
}): ItemMark {
  if (!editing) return {};
  return {
    'data-item-field': field,
    'data-item-index': index === undefined ? undefined : String(index),
    'data-item-ref': ref,
    'data-item-hidden': hidden ? '' : undefined,
  };
}
