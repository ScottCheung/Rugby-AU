import { createElement } from 'react';
import { Container } from '@/components/primitives/Container';
import { rootBlockWidth } from '@/lib/components/pageWidth';
import { getDefinition } from '@/lib/components/registry';
import type { ComponentNode } from '@/lib/types';
import { getSiteComponent } from './siteComponents';

/**
 * A page's blocks. Blocks placed directly on the page sit in the page
 * column unless a Section asks to be full width; nested blocks are drawn
 * inside their parent.
 */
export function RenderTree({
  nodes,
  siteSlug,
  nested = false,
}: {
  nodes: ComponentNode[];
  siteSlug: string;
  nested?: boolean;
}) {
  return nodes.map((node) => {
    const block = (
      <RenderNode
        key={node.id}
        node={node}
        siteSlug={siteSlug}
        nested={nested}
      />
    );
    if (nested || rootBlockWidth(node) !== 'contained') return block;
    return <Container key={node.id}>{block}</Container>;
  });
}

function RenderNode({
  node,
  siteSlug,
  nested,
}: {
  node: ComponentNode;
  siteSlug: string;
  nested: boolean;
}) {
  const definition = getDefinition(node.type);
  if (!definition)
    return <Skipped node={node} reason={`unknown type "${node.type}"`} />;

  // Stored JSON may be older than the current schemas: never crash the page.
  const parsed = definition.schema.safeParse(node.props);
  if (!parsed.success)
    return (
      <Skipped
        node={node}
        reason={parsed.error.issues[0]?.message ?? 'invalid props'}
      />
    );

  // Safe: the props were just validated against this type's own schema.
  return createElement(
    getSiteComponent(definition.type),
    { ...parsed.data, siteSlug, nested },
    definition.acceptsChildren && node.children ? (
      <RenderTree nodes={node.children} siteSlug={siteSlug} nested />
    ) : null,
  );
}

/** Invisible in production; a visible hint while developing. */
function Skipped({ node, reason }: { node: ComponentNode; reason: string }) {
  console.warn(`Skipped component ${node.id} (${node.type}): ${reason}`);
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div className="rounded border border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
      Component <code>{node.type}</code> ({node.id}) was not rendered: {reason}
    </div>
  );
}
