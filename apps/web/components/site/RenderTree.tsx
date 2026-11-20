import { createElement, Fragment } from 'react';
import { PageColumnBlock } from '@/components/primitives/Container';
import { rootBlockWidth } from '@/lib/components/pageWidth';
import { getDefinition } from '@/lib/components/registry';
import type { SiteData } from '@/lib/news';
import type { ComponentNode } from '@/lib/types';
import { stagger } from '@scottcheung/ui/motion';
import { animatesAsWhole } from '@/lib/motion';
import { Reveal } from './Reveal';
import { getSiteComponent } from './siteComponents';

/**
 * A page's blocks. Blocks placed directly on the page sit in the page
 * column unless a Section asks to be full width; nested blocks are drawn
 * inside their parent.
 */
export function RenderTree({
  nodes,
  siteSlug,
  data,
  nested = false,
  animate = true,
}: {
  nodes: ComponentNode[];
  siteSlug: string;
  /** Read by data-driven components such as Latest news. */
  data: SiteData;
  nested?: boolean;
  /** False inside the first block, which is on screen when the page opens. */
  animate?: boolean;
}) {
  return nodes.map((node, index) => {
    // The first block on the page is visible straight away: hiding it until
    // JavaScript runs would leave the top of the page blank.
    const first = !nested && index === 0;
    const block = (
      <RenderNode
        node={node}
        siteSlug={siteSlug}
        data={data}
        nested={nested}
        animate={animate && !first}
      />
    );
    // Content animates; containers let their contents do it (lib/motion.ts).
    const content =
      animate && !first && animatesAsWhole(node.type) ? (
        <Reveal
          className={nested ? 'min-w-0' : undefined}
          // Blocks side by side in a Section arrive one after another.
          delay={nested ? stagger(index) : 0}
        >
          {block}
        </Reveal>
      ) : nested ? (
        <div className="min-w-0">{block}</div>
      ) : (
        block
      );
    if (nested || rootBlockWidth(node) !== 'contained')
      return <Fragment key={node.id}>{content}</Fragment>;
    // Every page-column block gets the same flow spacing, whatever its type;
    // full-width blocks (above) add none, so bands sit flush.
    return <PageColumnBlock key={node.id}>{content}</PageColumnBlock>;
  });
}

function RenderNode({
  node,
  siteSlug,
  data,
  nested,
  animate,
}: {
  node: ComponentNode;
  siteSlug: string;
  data: SiteData;
  nested: boolean;
  animate: boolean;
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
    { ...parsed.data, siteSlug, nested, data },
    definition.acceptsChildren && node.children ? (
      <RenderTree
        nodes={node.children}
        siteSlug={siteSlug}
        data={data}
        nested
        animate={animate}
      />
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
