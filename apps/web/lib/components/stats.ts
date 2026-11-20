import { z } from 'zod';
import { defineComponent } from './define';

const statSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, 'Add a number or short value')
    .meta({ label: 'Number', placeholder: '1899' }),
  label: z
    .string()
    .trim()
    .min(1, 'Say what the number means')
    .meta({ label: 'Label', placeholder: 'First Test match' }),
});

export const statsSchema = z.object({
  stats: z.array(statSchema).meta({ label: 'Numbers', itemLabel: 'Number' }),
});

export const stats = defineComponent({
  type: 'stats',
  label: 'Stats',
  description:
    'A row of big numbers with a label each, such as titles won or clubs in the state.',
  schema: statsSchema,
  defaultProps: {
    stats: [
      { value: '2', label: 'Rugby World Cup titles' },
      { value: '1899', label: 'First Test match' },
    ],
  },
  acceptsChildren: false,
});
