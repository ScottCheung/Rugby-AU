/**
 * The fonts the app ships with, loaded once in app/layout.tsx from the
 * @fontsource packages (self-hosted, no network needed at build time).
 * A theme names a font from this list rather than storing a CSS stack, so
 * stored themes stay short and can never point at a font that isn't loaded.
 * Adding a font: install its @fontsource package, import it in the root
 * layout and add a line here.
 */
export const fontStacks = {
  inter: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  montserrat: "'Montserrat Variable', ui-sans-serif, system-ui, sans-serif",
  oswald: "'Oswald Variable', 'Arial Narrow', sans-serif",
  barlowCondensed: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  nunito: "'Nunito Variable', ui-rounded, system-ui, sans-serif",
} as const;

export type FontName = keyof typeof fontStacks;

/** The CSS stack for a font name; unknown names (old data) fall back to Inter. */
export const fontStack = (name: string): string =>
  name in fontStacks ? fontStacks[name as FontName] : fontStacks.inter;
