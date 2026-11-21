/**
 * Colour families, for filtering sites by their brand colour. A brand is
 * put in one family by its hue, lightness and saturation, so "navy" and
 * "sky blue" stay apart while every dark red lands with the reds.
 */
export const colourFamilies = {
  red: { label: 'Red', swatch: '#c8102e' },
  orange: { label: 'Orange', swatch: '#e0702b' },
  gold: { label: 'Gold', swatch: '#f2b705' },
  green: { label: 'Green', swatch: '#00843d' },
  blue: { label: 'Blue', swatch: '#4fb3e8' },
  navy: { label: 'Navy', swatch: '#0b2240' },
  purple: { label: 'Purple', swatch: '#6b3fa0' },
  black: { label: 'Black and grey', swatch: '#1a1a1a' },
} as const;

export type ColourFamily = keyof typeof colourFamilies;
export const colourFamilyIds = Object.keys(colourFamilies) as ColourFamily[];

/** #rrggbb -> hue (0..360), saturation and lightness (0..1). */
function toHsl(hex: string): [number, number, number] | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return undefined;
  const value = parseInt(match[1], 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 255, value & 255].map(
    (channel) => channel / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, lightness];
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === r
      ? ((g - b) / delta + 6) % 6
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return [hue * 60, saturation, lightness];
}

/** The family a brand colour belongs to; unreadable values count as grey. */
export function colourFamily(hex: string): ColourFamily {
  const hsl = toHsl(hex);
  if (!hsl) return 'black';
  const [hue, saturation, lightness] = hsl;
  if (lightness < 0.1 || saturation < 0.15) return 'black';
  if (hue < 15 || hue >= 330) return 'red';
  if (hue < 40) return 'orange';
  if (hue < 70) return 'gold';
  if (hue < 170) return 'green';
  if (hue < 260) return lightness < 0.35 ? 'navy' : 'blue';
  return 'purple';
}
