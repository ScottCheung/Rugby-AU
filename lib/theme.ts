import type { CSSProperties } from 'react';
import type { Theme } from './model';

/**
 * Site theme -> CSS custom properties. Site components only read these
 * variables, so the same component renders differently per site. The
 * `--ui-*` names feed the shared @scottcheung/ui primitives (Button etc.).
 */
export function themeToCssVars(theme: Theme): CSSProperties {
  return {
    '--brand': theme.brand,
    '--on-brand': theme.onBrand,
    '--accent': theme.accent,
    '--surface': theme.surface,
    '--site-bg': theme.background,
    '--site-text': theme.text,
    '--muted': theme.muted,
    '--heading-font': theme.headingFont,
    '--site-radius': theme.radius,
    '--ui-primary': theme.brand,
    '--ui-primary-hover': `color-mix(in srgb, ${theme.brand} 85%, ${theme.text})`,
    '--ui-on-primary': theme.onBrand,
    '--ui-fg': theme.text,
    '--ui-muted': theme.muted,
    '--ui-surface': theme.surface,
    '--ui-surface-raised': theme.surface,
    '--ui-border': `color-mix(in srgb, ${theme.text} 18%, transparent)`,
    '--ui-ring': `color-mix(in srgb, ${theme.brand} 45%, transparent)`,
    '--ui-radius-pill': theme.radius,
  } as CSSProperties;
}
