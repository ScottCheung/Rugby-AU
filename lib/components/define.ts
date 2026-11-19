import type { z } from 'zod';

/**
 * A component definition is everything the manager and the validator need
 * to know about a component. It deliberately contains no React code, so it
 * can be shared by the manager (client), the API (server) and the seed script.
 * How a component looks lives in `components/site/renderers.tsx`.
 */
export type ComponentDefinition<
  Type extends string = string,
  Props extends z.ZodObject = z.ZodObject,
> = {
  type: Type;
  label: string;
  description: string;
  category: 'layout' | 'content';
  /** Containers accept child components; everything else is a leaf. */
  allowsChildren: boolean;
  /** Single source of truth for the props: validation, TS types and the editing form. */
  props: Props;
};

export function defineComponent<
  const Type extends string,
  Props extends z.ZodObject,
>(definition: ComponentDefinition<Type, Props>) {
  return definition;
}
