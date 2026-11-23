import type { BlockDefinition, BlockProps } from './defineBlock';
import type { Item } from './roles';
import { sourceOf } from './sources';

/**
 * A block's name in the Layers tree, from what it holds, the same rule for
 * every type: one written item is named by itself ("About the
 * Wallabies"), several are counted ("Cards · 6"), and a data source names
 * its own ("News · latest 3").
 */
export function blockSummary(
  definition: BlockDefinition,
  props: BlockProps,
): string {
  const { content } = props;
  if (content.from === 'items') {
    const items: Item[] = content.items ?? [];
    const only = items.length === 1 ? items[0] : undefined;
    const own =
      only?.title?.trim() || only?.value?.trim() || only?.text?.slice(0, 40);
    return own || `${definition.itemsLabel} · ${items.length}`;
  }
  return sourceOf(content.from)?.summary(content) ?? definition.label;
}

/** The heading of a block's first written text, to name its Section. */
export function blockHeadline(props: BlockProps): string | undefined {
  if (props.content.from !== 'items') return undefined;
  return props.content.items?.[0]?.title?.trim() || undefined;
}
