import type {
  BlockDefinition,
  BlockProps,
} from '@/lib/components/blocks/defineBlock';
import { blockItems, type DrawnItem } from '@/lib/components/blocks/resolve';
import type { Item } from '@/lib/components/blocks/roles';
import { sources, type SourceId } from '@/lib/components/blocks/sources';
import type { ItemRef } from '@/lib/components/items';
import { getBlock } from '@/lib/components/registry';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode } from '@/lib/types';

/**
 * Small, pure helpers for editing a block from the panel and the Layers
 * tree. They only ever return new props; the editor stores them.
 */

export const blockOf = (node: ComponentNode): BlockDefinition | undefined =>
  getBlock(node.type);

export const propsOf = (node: ComponentNode) => node.props as BlockProps;

/** The block's items as the preview draws them (hidden ones included). */
export function drawnItems(node: ComponentNode, data: SiteData): DrawnItem[] {
  const block = blockOf(node);
  return block ? blockItems(block, propsOf(node), data, true) : [];
}

/** The same props with some content options changed. */
export function withContent(
  node: ComponentNode,
  change: Record<string, unknown>,
): Record<string, unknown> {
  const content = { ...propsOf(node).content, ...change };
  for (const key of Object.keys(change))
    if (change[key] === undefined) delete content[key];
  return { ...node.props, content };
}

/** Written items, as stored. */
export const itemsOf = (node: ComponentNode): Item[] =>
  propsOf(node).content.items ?? [];

/**
 * Hide or show one item: a written one carries its own flag, one from a
 * data source is hidden by id on the block (only in this block).
 */
export function toggleHidden(
  node: ComponentNode,
  ref: ItemRef,
): Record<string, unknown> {
  if ('index' in ref) {
    const items = itemsOf(node).map((item, index) => {
      if (index !== ref.index) return item;
      const { hidden, ...rest } = item;
      return hidden ? rest : { ...rest, hidden: true };
    });
    return withContent(node, { items });
  }
  const hidden = (propsOf(node).content.hidden as string[] | undefined) ?? [];
  const next = hidden.includes(ref.ref)
    ? hidden.filter((id) => id !== ref.ref)
    : [...hidden, ref.ref];
  return withContent(node, { hidden: next.length > 0 ? next : undefined });
}

/** What one item is called in this block: "card", "article", "match". */
export function itemNoun(node: ComponentNode): string {
  const block = blockOf(node);
  const from = propsOf(node).content.from;
  const source = from === 'items' ? undefined : sources[from as SourceId];
  return (source?.itemLabel ?? block?.itemLabel ?? 'Item').toLowerCase();
}

/** A short name for an item, for the breadcrumb and the tree. */
export function itemName(
  node: ComponentNode,
  ref: ItemRef,
  data: SiteData,
): string {
  const found = drawnItems(node, data).find((drawn) =>
    'index' in ref
      ? 'index' in drawn.ref && drawn.ref.index === ref.index
      : 'ref' in drawn.ref && drawn.ref.ref === ref.ref,
  );
  const item = found?.item;
  const raw = 'index' in ref ? itemsOf(node)[ref.index] : undefined;
  return (
    raw?.title ||
    raw?.value ||
    raw?.text?.slice(0, 40) ||
    (!raw && (item?.title || item?.value)) ||
    `${blockOf(node)?.itemLabel ?? 'Item'} ${'index' in ref ? ref.index + 1 : ''}`.trim()
  );
}
