import { z } from 'zod';
import '../components/editorMeta';

/**
 * A form field described as plain data. describeSchema() walks a Zod
 * schema once and produces these; components/manager/SchemaForm.tsx draws
 * them. Keeping the mapping pure makes it easy to unit-test.
 */
type BaseField = {
  /** Prop name (or the item label for list items). */
  key: string;
  label: string;
  hint?: string;
  /** Optional fields get an Add / Remove toggle and are omitted when absent. */
  optional: boolean;
};

export type FieldDescriptor =
  | (BaseField & {
      kind: 'text' | 'textarea' | 'url' | 'date';
      placeholder?: string;
    })
  | (BaseField & { kind: 'number' })
  | (BaseField & { kind: 'boolean' })
  | (BaseField & {
      kind: 'enum';
      /** `sketch` names a skeleton picture shown instead of a dropdown. */
      options: { value: string; label: string; sketch?: string }[];
    })
  | (BaseField & {
      kind: 'object';
      fields: FieldDescriptor[];
      widget?: 'image';
    })
  | (BaseField & { kind: 'array'; itemLabel: string; item: FieldDescriptor })
  | (BaseField & { kind: 'unsupported' });

/** "showDate" -> "Show date", "two-column" -> "Two column". */
export function humanize(key: string): string {
  const words = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Strip .optional() / .default() wrappers. Metadata can sit on any layer
 * (`z.string().meta(...).optional()` or `z.string().optional().meta(...)`),
 * so collect it on the way down; outer layers win.
 */
function unwrap(schema: z.ZodType) {
  let inner = schema;
  let optional = false;
  const metas: z.GlobalMeta[] = [];
  for (;;) {
    metas.unshift(inner.meta() ?? {});
    if (inner instanceof z.ZodOptional) {
      optional = true;
      inner = inner.unwrap() as z.ZodType;
    } else if (inner instanceof z.ZodDefault) {
      inner = inner.unwrap() as z.ZodType;
    } else {
      break;
    }
  }
  return { inner, optional, meta: Object.assign({}, ...metas) as z.GlobalMeta };
}

export function describeField(key: string, schema: z.ZodType): FieldDescriptor {
  const { inner, optional, meta } = unwrap(schema);
  const base: BaseField = {
    key,
    label: meta.label ?? humanize(key),
    hint: meta.hint,
    optional,
  };

  if (inner instanceof z.ZodURL)
    return { ...base, kind: 'url', placeholder: meta.placeholder };
  if (inner instanceof z.ZodString)
    return {
      ...base,
      kind:
        meta.format === 'date' ? 'date' : meta.multiline ? 'textarea' : 'text',
      placeholder: meta.placeholder,
    };
  if (inner instanceof z.ZodNumber) return { ...base, kind: 'number' };
  if (inner instanceof z.ZodBoolean) return { ...base, kind: 'boolean' };
  if (inner instanceof z.ZodEnum) {
    const values = inner.options as string[];
    return {
      ...base,
      kind: 'enum',
      options: values.map((value) => ({
        value,
        label: meta.optionLabels?.[value] ?? humanize(value),
        ...(meta.optionSketches?.[value]
          ? { sketch: meta.optionSketches[value] }
          : {}),
      })),
    };
  }
  if (inner instanceof z.ZodObject)
    return {
      ...base,
      kind: 'object',
      fields: describeSchema(inner),
      ...(meta.widget ? { widget: meta.widget } : {}),
    };
  if (inner instanceof z.ZodArray) {
    const itemLabel = meta.itemLabel ?? 'Item';
    return {
      ...base,
      kind: 'array',
      itemLabel,
      item: describeField(itemLabel, inner.element as z.ZodType),
    };
  }
  return { ...base, kind: 'unsupported' };
}

/** The fields of a component's props schema, in declaration order. */
export function describeSchema(schema: z.ZodObject): FieldDescriptor[] {
  return Object.entries(schema.shape as Record<string, z.ZodType>).map(
    ([key, field]) => describeField(key, field),
  );
}

/** The starting value for a new list item or an optional field being added. */
export function defaultValue(field: FieldDescriptor): unknown {
  switch (field.kind) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'enum':
      return field.options[0]?.value;
    case 'array':
      return [];
    case 'object':
      return Object.fromEntries(
        field.fields
          .filter((child) => !child.optional)
          .map((child) => [child.key, defaultValue(child)]),
      );
    default:
      return '';
  }
}
