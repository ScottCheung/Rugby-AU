import { z } from 'zod';
import { australianTeamIds, australianTeams } from '../fixtures/teams';
import { defineComponent } from './define';

/**
 * A data-driven component: the editor sets options only; the matches come
 * from the fixtures API when the page renders (lib/fixtures). It renders one
 * stack of cards; columns come from the Section around it.
 */
export const fixtureListSchema = z.object({
  title: z
    .string()
    .trim()
    .meta({ label: 'Title', placeholder: 'Fixtures and results' }),
  team: z.enum(australianTeamIds).optional().meta({
    label: 'Team',
    hint: 'Leave it out to show every Australian team.',
    optionLabels: australianTeams,
  }),
  show: z
    .enum(['upcoming', 'results', 'both'])
    .default('both')
    .meta({
      label: 'Show',
      hint: 'Both lists upcoming matches, then results, in one column. To put them side by side, use two Fixture lists in a two-column Section.',
      optionLabels: { upcoming: 'Upcoming', results: 'Results', both: 'Both' },
    }),
  limit: z
    .number()
    .int()
    .min(1, 'Show at least one')
    .max(12, 'Show at most 12')
    .default(4)
    .meta({
      label: 'How many',
      hint: 'With both, this many of each.',
    }),
});

export const fixtureList = defineComponent({
  type: 'fixtureList',
  label: 'Fixture list',
  description:
    'A column of match cards, upcoming or results, for one team or all of them, filled in automatically with scores once a match is over. Arrange several with a Section.',
  schema: fixtureListSchema,
  defaultProps: { title: 'Fixtures and results', show: 'both', limit: 4 },
  acceptsChildren: false,
});
