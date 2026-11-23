import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/** Paragraphs with an optional heading and button. */
export const text = defineBlock({
  type: 'text',
  label: 'Text',
  description: 'A heading and a few paragraphs, with an optional button.',
  itemLabel: 'Text',
  itemsLabel: 'Texts',
  sketch: 'item-text',
  roles: {
    title: optional('Heading', 'For a quote: who said it.'),
    text: required(
      'Text',
      'Leave an empty line between paragraphs. Start a line with "## " for a subheading.',
    ),
    link: optional('Button'),
  },
  style: z.object({
    variant: z.enum(['plain', 'centered', 'quote', 'headline', 'story']).meta({
      label: 'Text style',
      optionLabels: {
        plain: 'Plain',
        centered: 'Centred',
        quote: 'Quote',
        headline: 'Headline',
        story: 'Story',
      },
      optionSketches: {
        plain: 'text-plain',
        centered: 'text-centered',
        quote: 'text-quote',
        headline: 'text-headline',
        story: 'text-story',
      },
    }),
  }),
  defaults: {
    layout: { arrange: 'list' },
    style: { variant: 'plain' },
    items: [{ title: 'About us', text: 'Write a few sentences here.' }],
  },
  cell: { min: '18rem', perView: 2 },
});
