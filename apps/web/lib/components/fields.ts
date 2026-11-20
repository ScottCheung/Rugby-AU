import { z } from 'zod';
import './editorMeta';

/**
 * Field schemas shared by several components, so an image or a link is
 * validated and edited the same way everywhere.
 */

export const imageSchema = z
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

export const linkSchema = z
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
