import { z } from 'zod';

/**
 * Editor hints a component schema can attach with `.meta({...})`.
 * `title` and `description` are Zod's built-in keys (they also survive
 * `z.toJSONSchema`), the rest are read only by the manager's form generator.
 */
declare module 'zod' {
  interface GlobalMeta {
    placeholder?: string;
    /** Render a string as a multi-line textarea instead of a single input. */
    widget?: 'textarea';
    /** Human labels for enum values, keyed by value. */
    optionLabels?: Record<string, string>;
    /** Singular name for one item of an array, e.g. "Card". */
    itemLabel?: string;
  }
}

/** Remove `.default()` / `.optional()` wrappers and report what was removed. */
export function unwrapSchema(schema: z.ZodType): {
  inner: z.ZodType;
  optional: boolean;
} {
  let inner = schema;
  let optional = false;
  for (;;) {
    if (inner instanceof z.ZodOptional) {
      optional = true;
      inner = inner.unwrap() as z.ZodType;
    } else if (inner instanceof z.ZodDefault) {
      inner = inner.unwrap() as z.ZodType;
    } else {
      return { inner, optional };
    }
  }
}

/**
 * Metadata can sit on any layer (`z.string().meta(...).optional()` or
 * `z.string().optional().meta(...)`). Outer layers win.
 */
export function getMeta(schema: z.ZodType): z.GlobalMeta {
  const layers: z.ZodType[] = [schema];
  let current = schema;
  while (current instanceof z.ZodOptional || current instanceof z.ZodDefault) {
    current = current.unwrap() as z.ZodType;
    layers.push(current);
  }
  return layers.reduceRight<z.GlobalMeta>(
    (meta, layer) => ({ ...meta, ...(layer.meta() ?? {}) }),
    {},
  );
}

/** The value a freshly added component or list item starts with. */
export function defaultValueFor(schema: z.ZodType): unknown {
  if (schema instanceof z.ZodDefault)
    return structuredClone(schema.parse(undefined));
  if (schema instanceof z.ZodOptional) return undefined;
  if (schema instanceof z.ZodObject) {
    const result: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(
      schema.shape as Record<string, z.ZodType>,
    )) {
      const value = defaultValueFor(field);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
  if (schema instanceof z.ZodArray) return [];
  if (schema instanceof z.ZodEnum) return schema.options[0];
  if (schema instanceof z.ZodBoolean) return false;
  if (schema instanceof z.ZodNumber) return 0;
  return '';
}

/** "showDate" -> "Show date" for fields without a `title`. */
export function humanize(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
