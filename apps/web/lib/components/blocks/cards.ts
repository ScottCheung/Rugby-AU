import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/** Photo cards: the photo above the text, or the text on the photo. */
export const cards = defineBlock({
  type: 'cards',
  label: 'Cards',
  description: 'Photo cards with a heading, some text and a link.',
  itemLabel: 'Card',
  itemsLabel: 'Cards',
  sketch: 'item-card',
  roles: {
    image: required('Image'),
    title: required('Heading'),
    text: optional('Text'),
    link: optional('Link'),
  },
  style: z.object({
    look: z.enum(['card', 'overlay']).meta({
      label: 'Card',
      optionLabels: { card: 'Photo above', overlay: 'Text on photo' },
      optionSketches: { card: 'item-card', overlay: 'item-overlay' },
    }),
    ratio: z.enum(['wide', 'square', 'tall']).meta({
      label: 'Photo shape',
      optionLabels: { wide: 'Wide', square: 'Square', tall: 'Tall' },
    }),
    // On the photo: what shows before the visitor points at the card.
    // Absent is "on hover": the title alone, the rest rising in.
    details: z
      .enum(['hover', 'always'])
      .optional()
      .meta({
        label: 'Details',
        emptyIs: 'hover',
        showIf: { look: 'overlay' },
        optionLabels: { hover: 'On hover', always: 'Always' },
        optionDescriptions: {
          hover: 'Only the heading until pointed at',
          always: 'Everything, all the time',
        },
      }),
    showLabel: z
      .boolean()
      .optional()
      .meta({ label: 'Show the label', hint: 'The category and date line.', onByDefault: true }),
    showText: z.boolean().meta({ label: 'Show the text' }),
    showButton: z
      .boolean()
      .optional()
      .meta({ label: 'Show the button', onByDefault: true }),
  }),
  defaults: {
    layout: { arrange: 'grid' },
    style: { look: 'card', ratio: 'wide', showText: true },
  },
});
