import type { FieldDescriptor } from './describe';

/**
 * A short, generic description of a node's props for the manager outline,
 * e.g. "Two columns · Brand colour" or "Meet the squad · 3 cards". Built
 * from the field descriptors, so new components get it for free.
 */
export function summarizeProps(
  fields: FieldDescriptor[],
  props: Record<string, unknown>,
): string {
  const parts: string[] = [];
  for (const field of fields) {
    const value = props[field.key];
    if (field.kind === 'enum') {
      parts.push(
        field.options.find((option) => option.value === value)?.label ??
          String(value),
      );
    } else if (
      (field.kind === 'text' || field.kind === 'textarea') &&
      typeof value === 'string' &&
      value
    ) {
      parts.push(value);
    } else if (field.kind === 'array' && Array.isArray(value)) {
      const name = field.itemLabel.toLowerCase();
      parts.push(`${value.length} ${value.length === 1 ? name : `${name}s`}`);
    }
  }
  return parts.slice(0, 2).join(' · ');
}
