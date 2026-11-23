import { isImageAddress } from './components/fields';

export type LibraryImage = { url: string; alt: string };

const isImage = (value: unknown): value is LibraryImage =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as LibraryImage).url === 'string' &&
  typeof (value as LibraryImage).alt === 'string' &&
  isImageAddress((value as LibraryImage).url);

/**
 * Every image in this content (page trees, entries: any JSON), once each,
 * in the order found. The editor offers them as a site's image library, so
 * editors can reuse a photo instead of pasting an address. Images are found
 * by shape ({ url, alt }), so a new component's or collection's images are
 * included automatically.
 */
export function collectImages(...content: unknown[]): LibraryImage[] {
  const found = new Map<string, LibraryImage>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (isImage(value)) {
      if (!found.has(value.url))
        found.set(value.url, { url: value.url, alt: value.alt });
    } else if (typeof value === 'object' && value !== null)
      Object.values(value).forEach(visit);
  };
  content.forEach(visit);
  return [...found.values()];
}
