import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/**
 * Long text made of pieces in any order: paragraphs, subheadings,
 * pictures, quotes and lists (lib/components/story.ts). An article's body
 * is one; on any other page it is written here.
 */
export const story = defineBlock({
  type: 'story',
  label: 'Story',
  description:
    'Paragraphs, subheadings, pictures, quotes and lists, in any order.',
  itemLabel: 'Story',
  itemsLabel: 'Stories',
  sketch: 'item-story',
  roles: {
    title: optional('Heading'),
    story: required(
      'Story',
      'Add pieces in the order they are read. Each one can be moved up or down.',
    ),
  },
  style: z.object({
    size: z
      .enum(['standard', 'large'])
      .default('standard')
      .meta({
        label: 'Text size',
        optionLabels: { standard: 'Standard', large: 'Large' },
      }),
  }),
  defaults: {
    layout: { arrange: 'list' },
    style: { size: 'standard' },
    items: [
      {
        story: [
          { kind: 'heading', text: 'A subheading' },
          { kind: 'paragraph', text: 'Write the first paragraph here.' },
        ],
      },
    ],
  },
  cell: { min: '18rem', perView: 1 },
});
