/**
 * Picking a card colour from a photo. Pure, so it is unit-tested; reading
 * the image is done on the server by lib/imageColor.ts.
 */

export type Rgb = [number, number, number];

/**
 * The average colour of the bottom part of an image, given its pixels as
 * RGB bytes, row by row. `from` is where the bottom part starts (0.6 = the
 * bottom 40%), because that is where the card's colour meets the photo.
 */
export function averageBottom(
  pixels: Uint8Array,
  width: number,
  height: number,
  from = 0.6,
): Rgb {
  const total: Rgb = [0, 0, 0];
  let count = 0;
  for (let y = Math.floor(height * from); y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      total[0] += pixels[i];
      total[1] += pixels[i + 1];
      total[2] += pixels[i + 2];
      count++;
    }
  }
  return count
    ? (total.map((sum) => Math.round(sum / count)) as Rgb)
    : [31, 41, 55];
}

const white: Rgb = [255, 255, 255];

/**
 * The same hue, kept rich but dark enough for white text on top:
 * saturation at most 70%, lightness between 20% and 40%, then darker still
 * until white text has a contrast of at least 4.5 (bright hues such as
 * yellow need it).
 */
export function cardShade([r, g, b]: Rgb): Rgb {
  const [h, s, l] = toHsl(r / 255, g / 255, b / 255);
  const saturation = Math.min(s, 0.7);
  let lightness = Math.min(Math.max(l, 0.2), 0.4);
  let shade = fromHsl(h, saturation, lightness);
  while (contrast(shade, white) < 4.5 && lightness > 0.1) {
    lightness -= 0.02;
    shade = fromHsl(h, saturation, lightness);
  }
  return shade;
}

/** WCAG contrast ratio between two colours (1 to 21). */
export function contrast(a: Rgb, b: Rgb): number {
  const luminance = (rgb: Rgb) => {
    const [r, g, bl] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const toHex = (rgb: Rgb) =>
  `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;

function toHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function fromHsl(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    const v =
      u < 1 / 6
        ? p + (q - p) * 6 * u
        : u < 1 / 2
          ? q
          : u < 2 / 3
            ? p + (q - p) * (2 / 3 - u) * 6
            : p;
    return Math.round(v * 255);
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}
