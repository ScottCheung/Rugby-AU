import type { ComponentType } from '@/lib/components/registry';
import { getDefinition } from '@/lib/components/registry';
import type { ComponentInstance } from '@/lib/model';
import { CardGrid } from './card-grid';
import { Section } from './section';
import type { ComponentRenderer, RenderContext } from './types';

/**
 * How each component type looks. The mapped type makes TypeScript fail the
 * build if a component is registered without a renderer.
 */
const renderers: { [Type in ComponentType]: ComponentRenderer<Type> } = {
  section: Section,
  'card-grid': CardGrid,
};

export function RenderTree({
  components,
  context,
}: {
  components: ComponentInstance[];
  context: RenderContext;
}) {
  return components.map((component) => (
    <RenderedComponent
      key={component.id}
      component={component}
      context={context}
    />
  ));
}

function RenderedComponent({
  component,
  context,
}: {
  component: ComponentInstance;
  context: RenderContext;
}) {
  const definition = getDefinition(component.type);
  // Stored JSON may predate the current library: skip what we cannot render
  // instead of failing the whole page.
  const props = definition?.props.safeParse(component.props);
  if (!definition || !props?.success) {
    console.warn(
      `Skipping component ${component.id} (${component.type}): invalid or unknown.`,
    );
    return null;
  }
  // Safe: props were just validated against this type's schema.
  const Render = renderers[definition.type] as ComponentRenderer<ComponentType>;
  return (
    <Render props={props.data as never} context={context}>
      {component.children && (
        <RenderTree components={component.children} context={context} />
      )}
    </Render>
  );
}
