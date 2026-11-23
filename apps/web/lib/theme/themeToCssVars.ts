import type { CSSProperties } from 'react';
import { fontStack } from './fonts';
import { deepColour, isDarkSite } from './deepColour';
import type { Theme } from './types';

const densityFactor = { compact: 0.75, standard: 1, roomy: 1.3 } as const;

/** A spacing step at the site's density; standard leaves it as written. */
function scaled(value: string, density: Theme['density']): string {
  const factor = densityFactor[density] ?? 1;
  return factor === 1 ? value : `calc(${value} * ${factor})`;
}

/**
 * Theme -> CSS custom properties for the site wrapper element. The names
 * match the Tailwind theme in app/styles/theme.css, so utilities such as
 * `bg-brand`, `text-muted-text` or `rounded-site` pick up the site's values.
 */
export function themeToCssVars(theme: Theme): CSSProperties {
  return {
    '--color-brand': theme.colors.brand,
    '--color-brand-contrast': theme.colors.brandContrast,
    '--color-background': theme.colors.background,
    '--color-surface-light': theme.colors.surfaceLight,
    '--color-text': theme.colors.text,
    '--color-muted-text': theme.colors.mutedText,
    // The site's darkest colour, for fades and overlays.
    '--color-deep': deepColour(theme.colors),
    // Headings take the site's accent on light pages and the text colour on dark ones.
    '--color-heading': isDarkSite(theme.colors)
      ? theme.colors.text
      : deepColour(theme.colors),
    // Hero top: the soft deep fade on every site, so the header sits white
    // with a dark shadow over the photo. The bar takes the theme colours only
    // once it is solid (SiteHeader mixes them in as you scroll).
    '--hero-top-tint':
      'color-mix(in oklch, var(--color-deep) 35%, transparent)',
    '--hero-top-hold': '0%',
    // Hero bottom: light sites fade into the brand band below, dark sites keep deep.
    '--hero-fade': isDarkSite(theme.colors)
      ? 'var(--color-deep)'
      : 'var(--color-brand)',
    '--hero-text': isDarkSite(theme.colors)
      ? '#fff'
      : 'var(--color-brand-contrast)',
    '--header-text': '#fff',
    '--radius-site': cssLength(theme.radius),
    // The one corner and padding every card shares.
    '--radius-card': 'calc(var(--radius-site) * 1.75)',
    '--pad-card': 'calc(var(--spacing-site-sm) * 1.5)',
    '--font-site': fontStack(theme.fonts.body),
    '--font-site-heading': fontStack(theme.fonts.heading),
    '--heading-transform':
      theme.headingCase === 'uppercase' ? 'uppercase' : 'none',
    // Uppercase condensed headings read better with a little more spacing.
    '--heading-tracking':
      theme.headingCase === 'uppercase' ? '0.02em' : '-0.01em',
    // Every gap and padding on the site is one of these steps, scaled by
    // the site's density.
    '--spacing-site-xs': scaled(theme.spacing.xs, theme.density),
    '--spacing-site-sm': scaled(theme.spacing.sm, theme.density),
    '--spacing-site-md': scaled(theme.spacing.md, theme.density),
    '--spacing-site-lg': scaled(theme.spacing.lg, theme.density),
  } as CSSProperties;
}

/**
 * A bare 0 is a valid radius on its own, but not inside calc(): there
 * `calc(0 * 1.75)` is a number, not a length, so every rule using
 * --radius-card (the person card's clip-path among them) was dropped on
 * square-cornered sites. Give it a unit.
 */
function cssLength(value: string) {
  return /^\s*0*\.?0+\s*$/.test(value) ? '0px' : value;
}
