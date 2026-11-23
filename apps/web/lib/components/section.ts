import { z } from 'zod';
import { defineComponent } from './define';
import { imageSchema } from './fields';

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
  // The blocks inside are placed in these columns in order, wrapping to a
  // new row when there are more blocks than columns.
  columns: z.enum(['1', '1-1', '2-1', '1-2', '1-1-1']).meta({
    group: 'layout',
    label: 'Columns',
    optionLabels: {
      '1': 'One',
      '1-1': 'Two',
      '2-1': 'Wide left',
      '1-2': 'Wide right',
      '1-1-1': 'Three',
    },
    optionSketches: {
      '1': 'one-column',
      '1-1': 'two-column',
      '2-1': 'two-column-wide',
      '1-2': 'two-column-wide-right',
      '1-1-1': 'three-column',
    },
  }),
  // How the columns line up when they are not the same height.
  align: z
    .enum(['stretch', 'start', 'center', 'end'])
    .default('stretch')
    .meta({
      group: 'layout',
      label: 'Align columns',
      optionLabels: {
        stretch: 'Stretch',
        start: 'Top',
        center: 'Middle',
        end: 'Bottom',
      },
      optionSketches: {
        stretch: 'align-stretch',
        start: 'align-start',
        center: 'align-center',
        end: 'align-end',
      },
    }),
  // Resolved from the site's theme, so one value looks right on every site:
  // Primary is the brand colour, Secondary a light tint of it, Glass a
  // frosted pane, Image a photo under a veil of one of those.
  background: z.enum(['primary', 'secondary', 'glass', 'image', 'none']).meta({
    group: 'style',
    label: 'Background',
    optionLabels: {
      primary: 'Primary',
      secondary: 'Secondary',
      glass: 'Glass',
      image: 'Image',
      none: 'None',
    },
    optionSketches: {
      primary: 'tone-primary',
      secondary: 'tone-secondary',
      glass: 'tone-glass',
      image: 'tone-image',
      none: 'tone-none',
    },
  }),
  backgroundImage: imageSchema.optional().meta({
    group: 'style',
    label: 'Background image',
    showIf: { background: 'image' },
  }),
  // What lies over the photo so the text on it stays readable.
  overlay: z
    .enum(['primary', 'secondary', 'glass', 'none', 'blur'])
    .optional()
    .meta({
      group: 'style',
      label: 'Image overlay',
      emptyIs: 'primary',
      showIf: { background: 'image' },
      optionLabels: {
        primary: 'Primary',
        secondary: 'Secondary',
        glass: 'Glass',
        none: 'None',
        blur: 'Blur',
      },
      optionSketches: {
        primary: 'veil-primary',
        secondary: 'veil-secondary',
        glass: 'veil-glass',
        none: 'veil-none',
        blur: 'veil-blur',
      },
    }),
  // Space inside the section, above and below. Independent of the tone.
  padding: z
    .enum(['none', 'sm', 'md', 'lg'])
    .default('md')
    .meta({
      group: 'layout',
      label: 'Padding',
      optionLabels: { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' },
      optionSketches: {
        none: 'pad-none',
        sm: 'pad-sm',
        md: 'pad-md',
        lg: 'pad-lg',
      },
    }),
  width: z
    .enum(['full-background', 'full-padded', 'full-width'])
    .default('full-background')
    .meta({
      group: 'layout',
      label: 'Width',
      optionLabels: {
        'full-background': 'Column',
        'full-padded': 'Wide',
        'full-width': 'Full',
      },
      optionSketches: {
        'full-background': 'width-column',
        'full-padded': 'width-wide',
        'full-width': 'width-full',
      },
    }),
});

export const section = defineComponent({
  type: 'section',
  label: 'Section',
  description:
    'A band of the page: an optional heading and intro, then blocks side by side in one to three columns. It can hold another Section.',
  schema: sectionSchema,
  defaultProps: {
    columns: '1',
    align: 'stretch',
    background: 'none',
    padding: 'md',
    width: 'full-background',
  },
  acceptsChildren: true,
});

/** How many columns a Section has, from its `columns` value ("2-1" -> 2). */
export function columnCount(columns: unknown): number {
  return typeof columns === 'string' ? columns.split('-').length : 1;
}
