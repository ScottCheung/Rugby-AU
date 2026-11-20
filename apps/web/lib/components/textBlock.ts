import { z } from 'zod';
import { defineComponent } from './define';
import { linkSchema } from './fields';

export const textBlockSchema = z.object({
  heading: z
    .string()
    .trim()
    .min(1, 'Add a heading or remove it')
    .optional()
    .meta({ label: 'Heading' }),
  body: z.string().trim().min(1, 'Add some text').meta({
    label: 'Text',
    multiline: true,
    hint: 'Leave an empty line between paragraphs.',
  }),
  button: linkSchema.optional().meta({ label: 'Button' }),
});

export const textBlock = defineComponent({
  type: 'textBlock',
  label: 'Text',
  description:
    'A heading and a few paragraphs, with an optional button. For stories, explanations and calls to action.',
  schema: textBlockSchema,
  defaultProps: {
    heading: 'About us',
    body: 'Write a few sentences here.',
  },
  acceptsChildren: false,
});
