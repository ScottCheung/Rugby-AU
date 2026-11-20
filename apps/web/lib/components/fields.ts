import { z } from 'zod';
import './editorMeta';

/**
 * Field schemas shared by several components, so an image or a link is
 * validated and edited the same way everywhere.
 */

/**
 * An image address: a full https:// address, or a path on this website
 * ("/players/name.webp", from the app's public folder).
 */
export function isImageAddress(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const imageSchema = z
  .object({
    url: z
      .string()
      .trim()
      .refine(
        isImageAddress,
        'Enter a full image address (https://…) or a path on this site (/…)',
      )
      .meta({ label: 'Image address', placeholder: 'https://… or /images/…' }),
    alt: z
      .string()
      .trim()
      .min(1, 'Describe the image for people using screen readers')
      .meta({
        label: 'Image description',
        hint: 'Read aloud by screen readers. Describe what the photo shows.',
      }),
  })
  .meta({ label: 'Image', widget: 'image' });

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
