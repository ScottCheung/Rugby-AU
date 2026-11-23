import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { required } from './roles';

/** Big numbers in the heading font, each with a label. */
export const stats = defineBlock({
  type: 'stats',
  label: 'Numbers',
  description: 'Big numbers with a label each.',
  itemLabel: 'Number',
  itemsLabel: 'Numbers',
  sketch: 'item-stat',
  roles: {
    value: required('Number', 'A number or a short value: 1899, 2×, 64%.'),
    title: required('Label'),
  },
  style: z.object({
    size: z.enum(['m', 'l']).meta({
      label: 'Number size',
      optionLabels: { m: 'Medium', l: 'Large' },
    }),
    // Absent (older blocks) is centred. Auto: by the item's place in its
    // row (first left, last right, the rest centred).
    align: z
      .enum(['auto', 'left', 'center', 'right'])
      .optional()
      .meta({
        label: 'Alignment',
        emptyIs: 'center',
        hint: 'Auto: first in a row left, last right, the rest centred.',
        optionLabels: {
          auto: 'Auto',
          left: 'Left',
          center: 'Centre',
          right: 'Right',
        },
      }),
  }),
  defaults: {
    layout: { arrange: 'grid' },
    style: { size: 'l', align: 'center' },
    items: [
      { value: '2', title: 'Rugby World Cup titles' },
      { value: '1899', title: 'First Test match' },
    ],
  },
  cell: { min: '9rem', perView: 4 },
});
