import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/**
 * Breakout: a cut-out photo of a person breaking out of the top of its
 * card, or initials. The type stays `people` so saved pages keep working.
 */
export const people = defineBlock({
  type: 'people',
  label: 'Breakout',
  description: 'People whose cut-out photo breaks out of the top of the card.',
  itemLabel: 'Person',
  itemsLabel: 'People',
  sketch: 'item-profile',
  roles: {
    title: required('Name'),
    subtitle: optional('Role or position'),
    text: optional('Text'),
    cutout: optional(
      'Cut-out photo',
      'A PNG or WebP with a transparent background. The person can rise above the top of the card.',
    ),
    background: optional(
      'Background',
      'The card colour is taken from the bottom of this photo automatically.',
    ),
    link: optional('Link'),
  },
  style: z.object({
    // How much of the card's height the background takes; the rest above
    // it is where the head rises out. Absent (older blocks) is 70%.
    backgroundHeight: z
      .enum(['40', '50', '60', '70'])
      .optional()
      .meta({
        label: 'Background height',
        emptyIs: '70',
        optionLabels: { '40': '40%', '50': '50%', '60': '60%', '70': '70%' },
        optionSketches: {
          '40': 'breakout-40',
          '50': 'breakout-50',
          '60': 'breakout-60',
          '70': 'breakout-70',
        },
      }),
  }),
  defaults: { layout: { arrange: 'carousel' }, style: {} },
  cell: { min: '12rem', perView: 4 },
});
