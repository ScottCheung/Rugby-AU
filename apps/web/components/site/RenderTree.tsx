import type { ComponentType as ReactComponentType, ReactNode } from 'react';
import {
  getDefinition,
  type ComponentType,
  type PropsOf,
} from '@/lib/components/registry';
import type { ComponentNode } from '@/lib/types';
import { CardGrid } from './CardGrid';
import { Section } from './Section';

type SiteComponent<Type extends ComponentType> = ReactComponentType<
  PropsOf<Type> & { children?: ReactNode; siteSlug: string }
>;

/**
 * Component type -> React component. Used by the renderer only, so the
 * manager can import the schemas without pulling in render code. The mapped
 * type makes the build fail if a registered component has no renderer.
 */
const siteComponents: { [Type in ComponentType]: SiteComponent<Type> } = {
  section: Section,
  cardGrid: CardGrid,
};

export function RenderTree({
  nodes,
  siteSlug,
}: {
  nodes: ComponentNode[];
  siteSlug: string;
}) {
  return nodes.map((node) => (
    <RenderNode key={node.id} node={node} siteSlug={siteSlug} />
  ));
}

function RenderNode({
  node,
  siteSlug,
}: {
  node: ComponentNode;
  siteSlug: string;
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
  const Component = siteComponents[definition.type] as ReactComponentType<
    Record<string, unknown> & { children?: ReactNode; siteSlug: string }
  >;
  return (
    <Component {...parsed.data} siteSlug={siteSlug}>
      {definition.acceptsChildren && node.children && (
        <RenderTree nodes={node.children} siteSlug={siteSlug} />
      )}
    </Component>
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
