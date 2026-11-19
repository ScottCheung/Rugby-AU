import { z } from 'zod';
import { defineComponent } from './define';

export const section = defineComponent({
  type: 'section',
  label: 'Section',
  description: 'A layout container. Holds other components, including Sections.',
  category: 'layout',
  allowsChildren: true,
  props: z.object({
    layout: z
      .enum(['full', 'two-column'])
      .default('full')
      .meta({
        title: 'Layout',
        optionLabels: { full: 'Full width', 'two-column': 'Two columns' },
      }),
    background: z
      .enum(['none', 'light', 'brand'])
      .default('none')
      .meta({
        title: 'Background',
        description: 'Light and brand colours come from the site theme.',
        optionLabels: { none: 'None', light: 'Light', brand: 'Brand colour' },
      }),
  }),
});
