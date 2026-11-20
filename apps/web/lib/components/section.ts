import { z } from 'zod';
import { defineComponent } from './define';

export const sectionSchema = z.object({
  heading: z
    .string()
    .trim()
    .min(1, 'Add a heading or remove it')
    .optional()
    .meta({ label: 'Heading', placeholder: 'Meet the squad' }),
  intro: z
    .string()
    .trim()
    .min(1, 'Add some text or remove it')
    .optional()
    .meta({ label: 'Intro', multiline: true }),
  layout: z
    .enum(['full', 'two-column', 'two-column-wide', 'three-column'])
    .meta({
      label: 'Layout',
      hint: 'How the components inside are arranged on wide screens. On phones they always stack.',
      optionLabels: {
        full: 'Full width',
        'two-column': 'Two columns',
        'two-column-wide': 'Two columns, wide left',
        'three-column': 'Three columns',
      },
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
  description:
    'Groups other components, with an optional heading, a layout and a background.',
  schema: sectionSchema,
  defaultProps: { layout: 'full', background: 'none' },
  acceptsChildren: true,
});
