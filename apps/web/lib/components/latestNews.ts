import { z } from 'zod';
import { articleCategories } from './article';
import { defineComponent } from './define';

/**
 * A data-driven component: the editor sets options only; the cards come
 * from the site's article pages when the page renders (lib/news.ts).
 */
export const latestNewsSchema = z.object({
  title: z.string().trim().meta({ label: 'Title', placeholder: 'Latest news' }),
  category: z.enum(articleCategories).optional().meta({
    label: 'Only this category',
    hint: 'Leave it out to show every category.',
  }),
  limit: z
    .number()
    .int()
    .min(1, 'Show at least one')
    .max(12, 'Show at most 12')
    .default(3)
    .meta({ label: 'How many' }),
  display: z
    .enum(['grid', 'list', 'featured'])
    .default('featured')
    .meta({
      label: 'Display as',
      optionLabels: { grid: 'Grid', list: 'List', featured: 'Featured' },
      optionSketches: { grid: 'grid', list: 'list', featured: 'featured' },
    }),
});

export const latestNews = defineComponent({
  type: 'latestNews',
  label: 'Latest news',
  description:
    'The newest articles on this site, filled in automatically. Choose how many and, optionally, one category.',
  schema: latestNewsSchema,
  defaultProps: { title: 'Latest news', limit: 3, display: 'featured' },
  acceptsChildren: false,
});
