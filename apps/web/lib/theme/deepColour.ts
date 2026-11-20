import type { Theme } from './types';

/** Relative luminance (0 black .. 1 white) of a #rrggbb colour. */
export function luminance(hex: string) {
  const value = hex.replace('#', '');
  const channel = (start: number) => {
    const c = parseInt(value.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * The site's deepest colour, read from its own palette: the darkest of the
 * colours that sit behind or carry text. Used for fades and overlays so
 * they follow the site rather than a fixed colour.
 */
export function deepColour(colors: Theme['colors']) {
  // A dark brand colour is the block a fade runs into, so use it as is.
  if (/^#[0-9a-f]{6}$/i.test(colors.brand) && luminance(colors.brand) < 0.2)
    return colors.brand;
  const candidates = [
    colors.brand,
    colors.brandContrast,
    colors.background,
    colors.surfaceLight,
    colors.text,
  ].filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  return candidates.reduce((darkest, c) =>
    luminance(c) < luminance(darkest) ? c : darkest,
  );
}

/** A site is dark when its page background is dark; text then reads light. */
export function isDarkSite(colors: Theme['colors']) {
  return (
    /^#[0-9a-f]{6}$/i.test(colors.background) &&
    luminance(colors.background) < 0.2
  );
}
