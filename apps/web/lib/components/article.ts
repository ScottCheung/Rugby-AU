import { z } from 'zod';
import { defineComponent } from './define';
import { imageSchema } from './fields';

export const articleCategories = [
  'News',
  'Explainer',
  'History',
  'Match day',
  'Community',
  'Pathways',
  'Events',
] as const;

export const articleSchema = z.object({
  category: z.enum(articleCategories).meta({ label: 'Category' }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the publish date')
    .meta({ label: 'Published', format: 'date' }),
  headline: z
    .string()
    .trim()
    .min(1, 'Add a headline')
    .meta({ label: 'Headline' }),
  standfirst: z.string().trim().min(1, 'Add a sentence or two').meta({
    label: 'Standfirst',
    multiline: true,
    hint: 'One or two sentences under the headline. Also shown on news cards.',
  }),
  image: imageSchema,
  body: z.string().trim().min(1, 'Write the story').meta({
    label: 'Story',
    multiline: true,
    hint: 'Leave an empty line between paragraphs. Start a line with "## " for a subheading.',
  }),
});

export const article = defineComponent({
  type: 'article',
  label: 'Article',
  description:
    'A story to read: headline, category, date, photo and body. Article pages appear in Latest news.',
  schema: articleSchema,
  defaultProps: {
    category: 'News',
    date: '2026-11-20',
    headline: 'Headline',
    standfirst: 'One or two sentences that sum up the story.',
    // A real photo, so a new Article is valid until the editor picks one.
    image: {
      url: 'https://images.unsplash.com/photo-1529663297269-6d349ec39b57?auto=format&fit=crop&w=1600&q=80',
      alt: 'Rugby goal posts in a full stadium',
    },
    body: 'Write the story here.',
  },
  acceptsChildren: false,
});
