import { createElement, Fragment } from 'react';
import { getDefinition } from '@/lib/components/registry';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode } from '@/lib/types';
import { getSiteComponent } from './siteComponents';

/**
 * A page's component tree, drawn with the component library. Only
 * Sections sit on the page (validateTree); anything inside is drawn by its
 * parent.
 * Shared by the public site and the editor's preview (`editable`).
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
  /** Read by blocks whose items come from the site's data. */
  data: SiteData;
  nested?: boolean;
  /** False inside the first Section, which is on screen when the page opens. */
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
    const rendered = (
      <RenderNode
        node={node}
        siteSlug={siteSlug}
        data={data}
        nested={nested}
        animate={animate && (nested || index > 0)}
        editable={editable}
      />
    );
    const content = editable ? (
      <div data-component-id={node.id} style={{ display: 'contents' }}>
        {rendered}
      </div>
    ) : (
      rendered
    );
    // Inside a Section, each child is one of its grid cells. On the page,
    // a Section is a band across it and places its own content.
    return nested ? (
      <div key={node.id} className="min-w-0">
        {content}
      </div>
    ) : (
      <Fragment key={node.id}>{content}</Fragment>
    );
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
  // A block being edited is drawn as it is, even incomplete: missing fields
  // show as placeholders (lib/components/placeholders.ts).
  const parsed =
    editable && 'kind' in definition
      ? { success: true as const, data: node.props }
      : definition.schema.safeParse(node.props);
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
    {
      ...parsed.data,
      nodeId: node.id,
      siteSlug,
      nested,
      animate,
      data,
      editing: editable,
      // A container's children are drawn by one RenderTree: say how many.
      ...(definition.acceptsChildren
        ? { childCount: node.children?.length ?? 0 }
        : {}),
    },
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
