import { sourceOf } from '../components/blocks/sources';
import type { ComponentNode } from '../types';
import type { CollectionId } from './index';

/**
 * Blocks showing a collection's entries keep the slugs of the ones they
 * hide or pick. When an entry is deleted its slug means nothing any more:
 * drop it, so stale ones do not pile up. Called on save with the slugs of
 * the site's entries, by collection.
 */
export function pruneEntryRefs(
  tree: ComponentNode[],
  slugs: Record<CollectionId, Set<string>>,
): ComponentNode[] {
  return tree.map((node) => {
    const children = node.children && pruneEntryRefs(node.children, slugs);
    const content = node.props.content as Record<string, unknown> | undefined;
    const collection = sourceOf(content?.from)?.collection;
    if (!content || !collection) return children ? { ...node, children } : node;
    const known = slugs[collection];
    const next = { ...content };
    for (const key of ['hidden', 'picked'] as const) {
      const list = next[key];
      if (!Array.isArray(list)) continue;
      const kept = list.filter(
        (slug): slug is string => typeof slug === 'string' && known.has(slug),
      );
      if (kept.length > 0 || key === 'picked') next[key] = kept;
      else delete next[key];
    }
    return { ...node, props: { ...node.props, content: next } };
  });
}
