import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/** A large photo with its heading, text and button on it. */
export const hero = defineBlock({
  type: 'hero',
  label: 'Hero image',
  description: 'A large photo with a heading, text and a button.',
  itemLabel: 'Slide',
  itemsLabel: 'Slides',
  sketch: 'item-hero',
  roles: {
    image: required('Image'),
    title: required('Heading'),
    text: optional('Text'),
    link: optional('Button'),
  },
  style: z.object({
    height: z.enum(['short', 'tall']).meta({
      label: 'Height',
      optionLabels: { short: 'Banner', tall: 'Tall' },
    }),
  }),
  defaults: {
    layout: { arrange: 'slider' },
    style: { height: 'tall' },
  },
  cell: { min: '20rem', perView: 2 },
});
