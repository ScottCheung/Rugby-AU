import { z } from 'zod';
import { defineComponent } from './define';
import { imageSchema, linkSchema } from './fields';

const cardSchema = z.object({
  image: imageSchema,
  heading: z.string().trim().min(1, 'Add a heading').meta({ label: 'Heading' }),
  text: z
    .string()
    .trim()
    .min(1, 'Add some text or remove it')
    .optional()
    .meta({ label: 'Text', multiline: true }),
  link: linkSchema.optional(),
});

export const cardGridSchema = z.object({
  title: z
    .string()
    .trim()
    .meta({ label: 'Title', placeholder: 'Meet the squad' }),
  // Same cards, different presentation. Pages saved before this prop existed
  // get "grid" when they are parsed.
  variant: z
    .enum(['grid', 'list', 'featured', 'overlay', 'carousel', 'masonry'])
    .default('grid')
    .meta({
      label: 'Display as',
      hint: 'The same cards, arranged differently. Featured makes the first card large; Overlay puts the text on the photo; Masonry is a photo wall whose photos open full size.',
      optionLabels: {
        grid: 'Grid',
        list: 'List (photo beside text)',
        featured: 'Featured (first card large)',
        overlay: 'Overlay (text on photo)',
        carousel: 'Carousel',
        masonry: 'Masonry',
      },
    }),
  cards: z.array(cardSchema).meta({ label: 'Cards', itemLabel: 'Card' }),
});

export const cardGrid = defineComponent({
  type: 'cardGrid',
  label: 'Card Grid',
  description:
    'Cards with an image, a heading, optional text and an optional link, shown as a grid, a carousel or masonry.',
  schema: cardGridSchema,
  defaultProps: { title: 'Meet the squad', variant: 'grid', cards: [] },
  acceptsChildren: false,
});
