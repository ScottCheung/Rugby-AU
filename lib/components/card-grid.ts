import { z } from 'zod';
import { defineComponent } from './define';

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);

const card = z.object({
  image: z
    .object({
      url: z
        .string()
        .trim()
        .refine((value) => value === '' || isHttpUrl(value), {
          message: 'Use a full image address starting with https://',
        })
        .meta({ title: 'Image URL', placeholder: 'https://…' }),
      alt: z.string().trim().meta({
        title: 'Image description',
        description:
          'Read aloud by screen readers. Describe what is in the photo.',
        placeholder: 'e.g. Players running onto the field',
      }),
    })
    .meta({ title: 'Image' }),
  heading: z
    .string()
    .trim()
    .min(1, 'Add a heading for this card')
    .meta({ title: 'Card heading', placeholder: 'e.g. Our squad' }),
  link: z
    .object({
      label: z
        .string()
        .trim()
        .min(1, 'Add the link text')
        .default('Learn more')
        .meta({ title: 'Link text' }),
      href: z.string().trim().min(1, 'Add where the link goes').meta({
        title: 'Link URL',
        description:
          'A page on this site such as /about, or a full https:// address.',
        placeholder: '/about',
      }),
    })
    .optional()
    .meta({ title: 'Link' }),
});

export const cardGrid = defineComponent({
  type: 'card-grid',
  label: 'Card Grid',
  description:
    'A heading and a grid of cards with an image, heading and optional link.',
  category: 'content',
  allowsChildren: false,
  props: z.object({
    title: z
      .string()
      .trim()
      .default('Meet the team')
      .meta({ title: 'Heading' }),
    cards: z
      .array(card)
      .default([])
      .meta({ title: 'Cards', itemLabel: 'Card' }),
  }),
});
