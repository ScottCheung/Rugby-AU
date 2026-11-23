import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { required } from './roles';

/** Match cards, from the fixtures service: never written by hand. */
export const matches = defineBlock({
  type: 'matches',
  label: 'Matches',
  description: 'Upcoming matches and results, from the fixtures service.',
  itemLabel: 'Match',
  itemsLabel: 'Matches',
  sketch: 'item-match',
  roles: { match: required('Match') },
  style: z.object({
    showVenue: z.boolean().meta({ label: 'Show the venue' }),
  }),
  defaults: { layout: { arrange: 'list' }, style: { showVenue: true } },
  // A match card never stretches wider than its content needs.
  cell: { min: '18rem', perView: 3, max: '36rem' },
});
