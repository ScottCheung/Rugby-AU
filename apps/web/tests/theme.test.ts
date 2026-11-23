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
      fonts: { heading: 'oswald' },
      spacing: { lg: '6rem' },
    });
    expect(theme.radius).toBe('0');
    expect(theme.fonts).toEqual({ body: 'inter', heading: 'oswald' });
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
      '--spacing-site-lg': defaultTheme.spacing.lg,
    });
  });

  it('turns font names into loaded font stacks and sets the heading case', () => {
    const vars = themeToCssVars(
      resolveTheme(defaultTheme, {
        fonts: { heading: 'oswald' },
        headingCase: 'uppercase',
      }),
    ) as Record<string, string>;
    expect(vars['--font-site']).toContain('Inter Variable');
    expect(vars['--font-site-heading']).toContain('Oswald Variable');
    expect(vars['--heading-transform']).toBe('uppercase');
  });

  it('falls back to Inter for a font name the app does not ship', () => {
    const theme = {
      ...defaultTheme,
      fonts: { body: 'comic-sans', heading: 'inter' },
    } as unknown as typeof defaultTheme;
    const vars = themeToCssVars(theme) as Record<string, string>;
    expect(vars['--font-site']).toContain('Inter Variable');
  });

  it('gives square corners a unit, so calc() on the radius stays a length', () => {
    const vars = themeToCssVars(
      resolveTheme(defaultTheme, { radius: '0' }),
    ) as Record<string, string>;
    expect(vars['--radius-site']).toBe('0px');
  });
});

describe('spacing density', () => {
  it('scales every step, and leaves standard as written', () => {
    const standard = themeToCssVars(defaultTheme) as Record<string, string>;
    expect(standard['--spacing-site-sm']).toBe(defaultTheme.spacing.sm);
    const roomy = themeToCssVars({
      ...defaultTheme,
      density: 'roomy',
    }) as Record<string, string>;
    expect(roomy['--spacing-site-xs']).toBe('calc(0.5rem * 1.3)');
    expect(roomy['--spacing-site-lg']).toBe('calc(4rem * 1.3)');
  });
});
