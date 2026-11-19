import type { z } from 'zod';
import './editorMeta';

/**
 * Everything the manager, the validator and the seed need to know about a
 * component. No React code here, so it is safe to import on the server and
 * the client. How a component looks lives in components/site/.
 */
export type ComponentDefinition<
  Type extends string = string,
  Schema extends z.ZodObject = z.ZodObject,
> = {
  type: Type;
  /** Shown in the manager's "Add component" menu. */
  label: string;
  description: string;
  /** Single source of truth: prop types, validation and the editing form. */
  schema: Schema;
  defaultProps: z.infer<Schema>;
  acceptsChildren: boolean;
};

/** Identity helper that keeps the literal `type` and the schema's types. */
export function defineComponent<
  const Type extends string,
  Schema extends z.ZodObject,
>(definition: ComponentDefinition<Type, Schema>) {
  return definition;
}
