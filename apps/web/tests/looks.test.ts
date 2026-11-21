import { describe, expect, it } from 'vitest';
import { sites } from '../scripts/seed/sites';
import { defaultTheme } from '../lib/theme/defaultTheme';
import { lookForCategory, looks, matchLook } from '../lib/theme/looks';
import { resolveTheme } from '../lib/theme/resolveTheme';

describe('matchLook', () => {
  it('names the look every seeded site starts from', () => {
    for (const site of sites)
      expect(
        matchLook(resolveTheme(defaultTheme, site.theme))?.id,
        site.slug,
      ).toBe(lookForCategory[site.category].id);
  });

  it('tells the four looks apart', () => {
    const ids = Object.values(looks).map(
      (look) => matchLook(resolveTheme(defaultTheme, look.overrides))?.id,
    );
    expect(ids).toEqual(Object.values(looks).map((look) => look.id));
  });

  it('calls a theme changed away from every look custom', () => {
    const changed = resolveTheme(defaultTheme, {
      ...looks.matchDay.overrides,
      radius: '2rem',
    });
    expect(matchLook(changed)).toBeUndefined();
  });

  it('ignores colours: they belong to the site, not the look', () => {
    const recoloured = resolveTheme(defaultTheme, {
      ...looks.community.overrides,
      colors: { brand: '#ff0000' },
    });
    expect(matchLook(recoloured)?.id).toBe('community');
  });
});
