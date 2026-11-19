import { describe, expect, it } from 'vitest';
import { defaultTheme } from '../lib/theme/defaultTheme';
import { resolveTheme } from '../lib/theme/resolveTheme';
import { themeToCssVars } from '../lib/theme/themeToCssVars';

describe('resolveTheme', () => {
  it('returns the defaults when a site overrides nothing', () => {
    expect(resolveTheme(defaultTheme, {})).toEqual(defaultTheme);
    expect(resolveTheme(defaultTheme)).toEqual(defaultTheme);
  });

  it('overrides only the colours a site sets and keeps the rest', () => {
    const theme = resolveTheme(defaultTheme, { colors: { brand: '#123456' } });
    expect(theme.colors.brand).toBe('#123456');
    expect(theme.colors.text).toBe(defaultTheme.colors.text);
    expect(theme.radius).toBe(defaultTheme.radius);
    expect(theme.spacing).toEqual(defaultTheme.spacing);
  });

  it('supports overriding any token, at any depth', () => {
    const theme = resolveTheme(defaultTheme, {
      radius: '0',
      fontFamily: 'Georgia, serif',
      spacing: { lg: '6rem' },
    });
    expect(theme.radius).toBe('0');
    expect(theme.fontFamily).toBe('Georgia, serif');
    expect(theme.spacing).toEqual({ ...defaultTheme.spacing, lg: '6rem' });
  });

  it('ignores undefined overrides and does not mutate its inputs', () => {
    const before = structuredClone(defaultTheme);
    const overrides = { colors: { brand: undefined, text: '#000000' } };
    const theme = resolveTheme(defaultTheme, overrides);
    expect(theme.colors.brand).toBe(defaultTheme.colors.brand);
    expect(theme.colors.text).toBe('#000000');
    expect(defaultTheme).toEqual(before);
    expect(theme.colors).not.toBe(defaultTheme.colors);
  });
});

describe('themeToCssVars', () => {
  it('exposes every token as a CSS variable', () => {
    expect(themeToCssVars(defaultTheme)).toMatchObject({
      '--color-brand': defaultTheme.colors.brand,
      '--color-brand-contrast': defaultTheme.colors.brandContrast,
      '--color-muted-text': defaultTheme.colors.mutedText,
      '--radius-site': defaultTheme.radius,
      '--font-site': defaultTheme.fontFamily,
      '--spacing-site-lg': defaultTheme.spacing.lg,
    });
  });
});
