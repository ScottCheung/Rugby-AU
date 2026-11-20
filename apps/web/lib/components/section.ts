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
    .enum([
      'full',
      'two-column',
      'two-column-wide',
      'two-column-wide-right',
      'three-column',
    ])
    .meta({
      group: 'style',
      label: 'Layout',
      hint: 'How the components inside are arranged on wide screens. On phones they always stack.',
      optionLabels: {
        full: 'One column',
        'two-column': 'Two columns',
        'two-column-wide': 'Two columns, wide left',
        'two-column-wide-right': 'Two columns, wide right',
        'three-column': 'Three columns',
      },
      optionSketches: {
        full: 'one-column',
        'two-column': 'two-column',
        'two-column-wide': 'two-column-wide',
        'two-column-wide-right': 'two-column-wide-right',
        'three-column': 'three-column',
      },
    }),
  background: z.enum(['none', 'light', 'brand']).meta({
    group: 'style',
    label: 'Background',
    hint: 'Colours come from the site theme.',
    optionLabels: { none: 'None', light: 'Light', brand: 'Brand colour' },
  }),
  // Space inside the section, above and below. Independent of the
  // background; left out, it follows the width (see sectionPadding).
  padding: z
    .enum(['none', 'sm', 'md', 'lg'])
    .optional()
    .meta({
      group: 'style',
      label: 'Padding',
      hint: 'Space inside the section, above and below. The same with or without a background. Not set: Medium, or None for Edge to edge.',
      optionLabels: { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' },
    }),
  // Added after the first version, so it has a default (see README, 4).
  width: z
    .enum(['contained', 'full-background', 'full-width'])
    .default('contained')
    .meta({
      group: 'style',
      label: 'Width',
      hint: 'Applies to a Section placed directly on the page. Inside another Section it follows its parent.',
      optionLabels: {
        contained: 'Page column',
        'full-background': 'Full-width background',
        'full-width': 'Edge to edge',
      },
      optionSketches: {
        contained: 'contained',
        'full-background': 'full-background',
        'full-width': 'full-width',
      },
    }),
});

type SectionPadding = NonNullable<z.infer<typeof sectionSchema>['padding']>;

/**
 * The padding a Section really gets. Never depends on the background, so
 * switching colours keeps everything in place. Edge to edge (usually a hero
 * slider) sits flush by default; every other width gets the standard space.
 */
export function sectionPadding({
  padding,
  width,
}: {
  padding?: SectionPadding;
  width: z.infer<typeof sectionSchema>['width'];
}): SectionPadding {
  return padding ?? (width === 'full-width' ? 'none' : 'md');
}

export const section = defineComponent({
  type: 'section',
  label: 'Section',
  description:
    'Groups other components, with an optional heading, a layout and a background.',
  schema: sectionSchema,
  defaultProps: { layout: 'full', background: 'none', width: 'contained' },
  acceptsChildren: true,
});
