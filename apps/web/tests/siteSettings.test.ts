import { describe, expect, it } from 'vitest';
import {
  applySettings,
  contrastColour,
  settingsFromSite,
  siteSettingsSchema,
} from '../lib/site/settings';
import { defaultTheme } from '../lib/theme/defaultTheme';
import { matchLook } from '../lib/theme/looks';
import { resolveTheme } from '../lib/theme/resolveTheme';
import type { Site } from '../lib/types';
import { sites } from '../scripts/seed/sites';

const asSite = (index: number): Site => ({
  id: `site-${index}`,
  ...sites[index],
});

describe('contrastColour', () => {
  it('keeps the site’s own text colour while it stays readable', () => {
    expect(contrastColour('#ffcd00', '#00573f')).toBe('#00573f');
  });

  it('prefers the site’s own colours before white or black', () => {
    expect(contrastColour('#f4c21b', '#ffffff', ['#0d2a1e', '#f5f0e1'])).toBe(
      '#0d2a1e',
    );
  });

  it('switches to white or near-black when it would not be', () => {
    expect(contrastColour('#0b3d2e', '#00573f')).toBe('#ffffff');
    expect(contrastColour('#ffe66d', '#ffffff')).toBe('#111111');
  });
});

describe('site settings', () => {
  it('reads every seeded site into settings that pass the form’s checks', () => {
    for (const [index, site] of sites.entries())
      expect(
        siteSettingsSchema.safeParse(settingsFromSite(asSite(index))).success,
        site.slug,
      ).toBe(true);
  });

  it('saving the settings as they are changes nothing visible', () => {
    for (const index of sites.keys()) {
      const site = asSite(index);
      const after = applySettings(site, settingsFromSite(site));
      expect(resolveTheme(defaultTheme, after.theme)).toEqual(
        resolveTheme(defaultTheme, site.theme),
      );
    }
  });

  it('changes the look and the brand colour, keeping text readable', () => {
    const site = asSite(0);
    const after = applySettings(site, {
      ...settingsFromSite(site),
      look: 'matchDay',
      brand: '#101820',
    });
    const theme = resolveTheme(defaultTheme, after.theme);
    expect(matchLook(theme)?.id).toBe('matchDay');
    expect(theme.colors.brand).toBe('#101820');
    expect(contrastColour(theme.colors.brand, theme.colors.brandContrast)).toBe(
      theme.colors.brandContrast,
    );
  });

  it('returns to the original pairing when the brand colour goes back', () => {
    const wallabies = asSite(
      sites.findIndex((site) => site.slug === 'wallabies'),
    );
    const original = settingsFromSite(wallabies);
    const red = applySettings(wallabies, { ...original, brand: '#b3122e' });
    const back = applySettings(red, original);
    expect(resolveTheme(defaultTheme, back.theme).colors).toEqual(
      resolveTheme(defaultTheme, wallabies.theme).colors,
    );
  });

  it('clears optional fields that were removed', () => {
    const site = { ...asSite(0), logoUrl: '/logo.png' };
    const settings = { ...settingsFromSite(site), logoUrl: undefined };
    expect(applySettings(site, settings).logoUrl).toBeUndefined();
  });
});

describe('every colour a site sets', () => {
  it('reads each colour back from the site, and writes it into the theme', () => {
    const site = asSite(0);
    const settings = {
      ...settingsFromSite(site),
      background: '#fdfcf7',
      surfaceLight: '#eef2f8',
      text: '#1a1a2e',
      mutedText: '#5a6378',
    };
    const after = applySettings(site, settings);
    const colors = resolveTheme(defaultTheme, after.theme).colors;
    expect(colors).toMatchObject({
      background: '#fdfcf7',
      surfaceLight: '#eef2f8',
      text: '#1a1a2e',
      mutedText: '#5a6378',
    });
    expect(settingsFromSite(after)).toMatchObject({
      background: '#fdfcf7',
      text: '#1a1a2e',
    });
  });

  it('picks the text on the brand colour against the site’s own background and text', () => {
    const site = asSite(0);
    const after = applySettings(site, {
      ...settingsFromSite(site),
      brand: '#1d1a5e',
      background: '#ffffff',
      text: '#14201b',
    });
    const brandContrast = resolveTheme(defaultTheme, after.theme).colors
      .brandContrast;
    expect(contrastColour('#1d1a5e', brandContrast)).toBe(brandContrast);
  });
});
