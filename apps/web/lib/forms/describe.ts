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
  /** The editor tab it is on: content (the default), layout or style. */
  group: FieldGroup;
  /** Hides the item it belongs to: an eye toggle, not a form field. */
  visibility?: true;
  /** Kept by the editor itself (a block's hidden articles): not drawn. */
  managed?: true;
  /** Drawn only while sibling fields have these values. */
  showIf?: Record<string, string | boolean>;
};

export const fieldGroups = ['content', 'layout', 'style'] as const;
export type FieldGroup = (typeof fieldGroups)[number];

export type FieldDescriptor =
  | (BaseField & {
      kind: 'text' | 'textarea' | 'url' | 'date' | 'color' | 'image';
      placeholder?: string;
    })
  | (BaseField & { kind: 'number' })
  | (BaseField & { kind: 'boolean'; onByDefault?: true })
  | (BaseField & {
      kind: 'enum';
      /** Each option is a card: a picture or a type sample, a label, a line. */
      options: EnumOption[];
      /** An optional enum's "nothing chosen" card. */
      emptyLabel?: string;
      /** The option an absent value means (no "not set" card then). */
      emptyIs?: string;
    })
  | (BaseField & {
      kind: 'object';
      fields: FieldDescriptor[];
      widget?: 'image';
    })
  | (BaseField & { kind: 'array'; itemLabel: string; item: FieldDescriptor })
  /**
   * One of several shapes, told apart by one field (`discriminator`): a
   * block's content is written here or comes from News, each with its own
   * options. The form picks the shape, then shows that shape's fields.
   */
  | (BaseField & {
      kind: 'union';
      discriminator: string;
      options: (EnumOption & { fields: FieldDescriptor[] })[];
    })
  | (BaseField & { kind: 'unsupported' });

/** One choice of an enum, as its card shows it. */
export type EnumOption = {
  value: string;
  label: string;
  description?: string;
  /** A skeleton picture (components/manager/Sketch.tsx). */
  sketch?: string;
  /** A type sample: font, case and corner. */
  sample?: { font: string; uppercase?: boolean; radius?: string };
};

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
    group: meta.group ?? 'content',
    ...(meta.visibility ? { visibility: true as const } : {}),
    ...(meta.managed ? { managed: true as const } : {}),
    ...(meta.showIf ? { showIf: meta.showIf } : {}),
  };

  if (inner instanceof z.ZodURL)
    return { ...base, kind: 'url', placeholder: meta.placeholder };
  if (inner instanceof z.ZodString)
    return {
      ...base,
      kind:
        meta.format === 'date'
          ? 'date'
          : meta.format === 'color'
            ? 'color'
            : meta.format === 'image'
              ? 'image'
              : meta.multiline
                ? 'textarea'
                : 'text',
      placeholder: meta.placeholder,
    };
  if (inner instanceof z.ZodNumber) return { ...base, kind: 'number' };
  if (inner instanceof z.ZodBoolean)
    return {
      ...base,
      kind: 'boolean',
      ...(meta.onByDefault ? { onByDefault: true as const } : {}),
    };
  if (inner instanceof z.ZodEnum) {
    const values = inner.options as string[];
    return {
      ...base,
      kind: 'enum',
      ...(meta.emptyLabel ? { emptyLabel: meta.emptyLabel } : {}),
      ...(meta.emptyIs ? { emptyIs: meta.emptyIs } : {}),
      options: values.map((value) => ({
        value,
        label: meta.optionLabels?.[value] ?? humanize(value),
        ...(meta.optionDescriptions?.[value]
          ? { description: meta.optionDescriptions[value] }
          : {}),
        ...(meta.optionSketches?.[value]
          ? { sketch: meta.optionSketches[value] }
          : {}),
        ...(meta.optionSamples?.[value]
          ? { sample: meta.optionSamples[value] }
          : {}),
      })),
    };
  }
  if (inner instanceof z.ZodObject)
    return {
      ...base,
      kind: 'object',
      fields: describeSchema(inner),
      ...(meta.widget === 'image' ? { widget: 'image' as const } : {}),
    };
  if (inner instanceof z.ZodDiscriminatedUnion) {
    const discriminator = inner.def.discriminator;
    return {
      ...base,
      kind: 'union',
      discriminator,
      options: (inner.options as z.ZodObject[]).map((option) => {
        const tag = option.shape[discriminator] as z.ZodLiteral;
        const value = String(tag.value);
        return {
          value,
          label: meta.optionLabels?.[value] ?? humanize(value),
          ...(meta.optionDescriptions?.[value]
            ? { description: meta.optionDescriptions[value] }
            : {}),
          ...(meta.optionSketches?.[value]
            ? { sketch: meta.optionSketches[value] }
            : {}),
          fields: describeSchema(option).filter(
            (field) => field.key !== discriminator,
          ),
        };
      }),
    };
  }
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
    case 'union': {
      const first = field.options[0];
      return first
        ? {
            [field.discriminator]: first.value,
            ...(defaultValue({
              ...field,
              kind: 'object',
              fields: first.fields,
            }) as object),
          }
        : {};
    }
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

/** Whether a field is drawn, given the values of its siblings. */
export function isShown(
  field: FieldDescriptor,
  siblings: Record<string, unknown>,
): boolean {
  if (field.visibility || field.managed) return false;
  if (!field.showIf) return true;
  return Object.entries(field.showIf).every(
    ([key, wanted]) => (siblings[key] ?? false) === wanted,
  );
}
