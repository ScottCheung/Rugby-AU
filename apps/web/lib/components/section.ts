import { z } from 'zod';
import { defineComponent } from './define';

export const sectionSchema = z.object({
  layout: z.enum(['full', 'two-column']).meta({
    label: 'Layout',
    hint: 'Two columns places the components inside side by side on wide screens.',
    optionLabels: { full: 'Full width', 'two-column': 'Two columns' },
  }),
  background: z.enum(['none', 'light', 'brand']).meta({
    label: 'Background',
    hint: 'Colours come from the site theme.',
    optionLabels: { none: 'None', light: 'Light', brand: 'Brand colour' },
  }),
});

export const section = defineComponent({
  type: 'section',
  label: 'Section',
  description: 'Groups other components and sets their layout and background.',
  schema: sectionSchema,
  defaultProps: { layout: 'full', background: 'none' },
  acceptsChildren: true,
});
