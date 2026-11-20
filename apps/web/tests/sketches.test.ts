import { describe, expect, it } from 'vitest';
import { hasSketch } from '../components/manager/Sketch';
import { componentDefinitions } from '../lib/components/registry';
import { describeSchema, type FieldDescriptor } from '../lib/forms/describe';

/** Every enum option, at any depth, in every component's form. */
function options(fields: FieldDescriptor[]): { sketch?: string }[] {
  return fields.flatMap((field) => {
    if (field.kind === 'enum') return field.options;
    if (field.kind === 'object') return options(field.fields);
    if (field.kind === 'array') return options([field.item]);
    return [];
  });
}

describe('layout sketches', () => {
  it('has a drawing for every sketch a schema names', () => {
    for (const definition of componentDefinitions)
      for (const option of options(describeSchema(definition.schema)))
        if (option.sketch)
          expect(hasSketch(option.sketch), option.sketch).toBe(true);
  });
});
