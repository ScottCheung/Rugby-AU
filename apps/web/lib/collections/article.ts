import { z } from 'zod';
import { imageSchema } from '../components/fields';
import { storySchema } from '../components/story';

export const articleCategories = [
  'News',
  'Explainer',
  'History',
  'Match day',
  'Community',
  'Pathways',
  'Events',
] as const;

/**
 * A news article: data, not a component. Its fields are fixed because
 * lists, filters and news cards read them; how an article page looks is
 * the site's news template, a page made of ordinary blocks bound to these
 * fields (lib/components/blocks/sources.ts, `entry`).
 */
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
  body: storySchema.meta({
    label: 'Story',
    itemLabel: 'Piece',
    widget: 'story',
    hint: 'Paragraphs, subheadings, pictures, quotes and lists, in any order.',
  }),
});
