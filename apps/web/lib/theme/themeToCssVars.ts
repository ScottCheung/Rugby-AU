import type { CSSProperties } from 'react';
import { fontStack } from './fonts';
import { deepColour, isDarkSite } from './deepColour';
import type { Theme } from './types';

/**
 * Theme -> CSS custom properties for the site wrapper element. The names
 * match the Tailwind theme in app/globals.css, so utilities such as
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
    '--hero-top-tint': 'color-mix(in oklch, var(--color-deep) 35%, transparent)',
    '--hero-top-hold': '0%',
    // Hero bottom: light sites fade into the brand band below, dark sites keep deep.
    '--hero-fade': isDarkSite(theme.colors) ? 'var(--color-deep)' : 'var(--color-brand)',
    '--hero-text': isDarkSite(theme.colors) ? '#fff' : 'var(--color-brand-contrast)',
    '--header-text': '#fff',
    '--radius-site': theme.radius,
    '--font-site': fontStack(theme.fonts.body),
    '--font-site-heading': fontStack(theme.fonts.heading),
    '--heading-transform':
      theme.headingCase === 'uppercase' ? 'uppercase' : 'none',
    // Uppercase condensed headings read better with a little more spacing.
    '--heading-tracking':
      theme.headingCase === 'uppercase' ? '0.02em' : '-0.01em',
    '--spacing-site-sm': theme.spacing.sm,
    '--spacing-site-md': theme.spacing.md,
    '--spacing-site-lg': theme.spacing.lg,
  } as CSSProperties;
}
