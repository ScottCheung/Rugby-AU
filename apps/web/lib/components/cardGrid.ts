import { z } from 'zod';
import { defineComponent } from './define';

const imageSchema = z
  .object({
    url: z
      .url({
        protocol: /^https?$/,
        error: 'Enter a full image address starting with https://',
      })
      .meta({ label: 'Image address', placeholder: 'https://…' }),
    alt: z
      .string()
      .trim()
      .min(1, 'Describe the image for people using screen readers')
      .meta({
        label: 'Image description',
        hint: 'Read aloud by screen readers. Describe what the photo shows.',
      }),
  })
  .meta({ label: 'Image' });

const linkSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, 'Add the link text')
      .meta({ label: 'Link text', placeholder: 'Read more' }),
    href: z.string().trim().min(1, 'Add where the link goes').meta({
      label: 'Link address',
      hint: 'A page on this site such as /about, or a full https:// address.',
      placeholder: '/about',
    }),
  })
  .meta({ label: 'Link' });

const cardSchema = z.object({
  image: imageSchema,
  heading: z.string().trim().min(1, 'Add a heading').meta({ label: 'Heading' }),
  link: linkSchema.optional(),
});

export const cardGridSchema = z.object({
  title: z
    .string()
    .trim()
    .meta({ label: 'Title', placeholder: 'Meet the squad' }),
  cards: z.array(cardSchema).meta({ label: 'Cards', itemLabel: 'Card' }),
});

export const cardGrid = defineComponent({
  type: 'cardGrid',
  label: 'Card Grid',
  description:
    'A title and a grid of cards, each with an image, a heading and an optional link.',
  schema: cardGridSchema,
  defaultProps: { title: 'Meet the squad', cards: [] },
  acceptsChildren: false,
});
