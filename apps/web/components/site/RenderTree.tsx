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
  editable = false,
}: {
  nodes: ComponentNode[];
  siteSlug: string;
  /** Read by data-driven components such as Latest news. */
  data: SiteData;
  nested?: boolean;
  /** False inside the first block, which is on screen when the page opens. */
  animate?: boolean;
  /**
   * Only in the editor's preview: each component is wrapped in an element
   * carrying its id, so a click can say which component it hit. The
   * wrapper is display: contents, so it adds no box and the layout is the
   * same as the public page, which never gets these attributes.
   */
  editable?: boolean;
}) {
  return nodes.map((node, index) => {
    // The first block on the page is visible straight away: hiding it until
    // JavaScript runs would leave the top of the page blank.
    const first = !nested && index === 0;
    const rendered = (
      <RenderNode
        node={node}
        siteSlug={siteSlug}
        data={data}
        nested={nested}
        animate={animate && !first}
        editable={editable}
      />
    );
    const block = editable ? (
      <div data-component-id={node.id} style={{ display: 'contents' }}>
        {rendered}
      </div>
    ) : (
      rendered
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
  editable,
}: {
  node: ComponentNode;
  siteSlug: string;
  data: SiteData;
  nested: boolean;
  animate: boolean;
  editable: boolean;
}) {
  const definition = getDefinition(node.type);
  if (!definition)
    return (
      <Skipped
        node={node}
        reason={`unknown type "${node.type}"`}
        visible={editable}
      />
    );

  // Stored JSON may be older than the current schemas: never crash the page.
  const parsed = definition.schema.safeParse(node.props);
  if (!parsed.success)
    return (
      <Skipped
        node={node}
        reason={parsed.error.issues[0]?.message ?? 'invalid props'}
        visible={editable}
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
        editable={editable}
      />
    ) : null,
  );
}

/**
 * A component whose props fail its schema. Visitors see nothing; the
 * editor's preview (and development) shows a note, so a half-filled
 * component does not just vanish while it is being edited.
 */
function Skipped({
  node,
  reason,
  visible,
}: {
  node: ComponentNode;
  reason: string;
  visible: boolean;
}) {
  if (!visible)
    console.warn(`Skipped component ${node.id} (${node.type}): ${reason}`);
  if (!visible && process.env.NODE_ENV !== 'development') return null;
  const label = getDefinition(node.type)?.label ?? node.type;
  return (
    <div className="rounded border border-amber-500 bg-amber-50 p-3 font-sans text-sm text-amber-900">
      {label} is hidden on the live page until its fields are fixed: {reason}
    </div>
  );
}
