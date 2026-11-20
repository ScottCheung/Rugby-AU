import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { averageBottom, cardShade, toHex } from './color';

/**
 * Server only: the card colour for an image, taken from its bottom part
 * and darkened for white text (lib/color.ts). Each image is read once per
 * server process. Site paths ("/players/x.webp") are read from public/.
 */
const cache = new Map<string, Promise<string>>();
const fallback = '#1f2937';

async function load(url: string): Promise<Buffer> {
  if (url.startsWith('/')) {
    // The web app's public folder, whether run from the app or the repo root.
    for (const root of [process.cwd(), path.join(process.cwd(), 'apps/web')]) {
      try {
        return await readFile(path.join(root, 'public', url));
      } catch {
        // try the next root
      }
    }
    throw new Error(`Not found: ${url}`);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function compute(url: string): Promise<string> {
  try {
    const size = 32;
    const pixels = await sharp(await load(url))
      .removeAlpha()
      .resize(size, size, { fit: 'fill' })
      .raw()
      .toBuffer();
    return toHex(cardShade(averageBottom(new Uint8Array(pixels), size, size)));
  } catch {
    // A colour is decoration: never fail a page over it.
    return fallback;
  }
}

export function cardColor(url: string): Promise<string> {
  let color = cache.get(url);
  if (!color) {
    color = compute(url);
    cache.set(url, color);
  }
  return color;
}

/** Colours for several images at once, keyed by image address. */
export async function cardColors(
  urls: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(urls)];
  const colors = await Promise.all(unique.map(cardColor));
  return Object.fromEntries(unique.map((url, i) => [url, colors[i]]));
}
