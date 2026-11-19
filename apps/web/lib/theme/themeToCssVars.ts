import type { CSSProperties } from 'react';
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
    '--radius-site': theme.radius,
    '--font-site': theme.fontFamily,
    '--spacing-site-sm': theme.spacing.sm,
    '--spacing-site-md': theme.spacing.md,
    '--spacing-site-lg': theme.spacing.lg,
  } as CSSProperties;
}
