import type { SiteCategory } from '../types';
import { defaultTheme } from './defaultTheme';
import type { FontName } from './fonts';
import { resolveTheme } from './resolveTheme';
import type { Theme, ThemeOverrides } from './types';

/**
 * Looks: named sets of type, corners and spacing that sites share. Colours
 * are not part of a look; every site keeps its own palette. Each kind of
 * site starts from one look (the seed applies it), and the manager names a
 * site's look by matching its theme against these.
 */
export type Look = {
  id: string;
  name: string;
  description: string;
  overrides: Omit<ThemeOverrides, 'colors'>;
};

export const looks = {
  official: {
    id: 'official',
    name: 'Official',
    description: 'Modern and official: Montserrat headings, soft corners.',
    overrides: {
      fonts: { body: 'inter', heading: 'montserrat' },
      radius: '0.75rem',
    },
  },
  testMatch: {
    id: 'testMatch',
    name: 'Test match',
    description:
      'Bold Test-match headlines in Oswald capitals, near-square corners, more room.',
    overrides: {
      fonts: { body: 'inter', heading: 'oswald' },
      headingCase: 'uppercase',
      radius: '0.25rem',
      spacing: { md: '2.5rem', lg: '5rem' },
    },
  },
  matchDay: {
    id: 'matchDay',
    name: 'Match day',
    description:
      'A match-day poster: condensed Barlow capitals and square corners.',
    overrides: {
      fonts: { body: 'inter', heading: 'barlowCondensed' },
      headingCase: 'uppercase',
      radius: '0',
    },
  },
  community: {
    id: 'community',
    name: 'Community',
    description: 'Friendly and local: rounded Nunito type and soft corners.',
    overrides: {
      fonts: { body: 'nunito', heading: 'nunito' },
      radius: '1.5rem',
    },
  },
} as const satisfies Record<string, Look>;

/** The look each kind of site starts from. */
export const lookForCategory: Record<SiteCategory, Look> = {
  'governing-body': looks.official,
  'national-team': looks.testMatch,
  'super-rugby': looks.matchDay,
  'state-union': looks.community,
};

/** Display names for the fonts a theme can name. */
export const fontLabels: Record<FontName, string> = {
  inter: 'Inter',
  montserrat: 'Montserrat',
  oswald: 'Oswald',
  barlowCondensed: 'Barlow Condensed',
  nunito: 'Nunito',
};

/** Everything a look decides, so two themes can be compared on it. */
const lookKey = (theme: Theme) =>
  JSON.stringify([
    theme.fonts.body,
    theme.fonts.heading,
    theme.headingCase,
    theme.radius,
    theme.spacing,
  ]);

/**
 * The look a site's theme follows, or undefined when it has been changed
 * away from every look (the manager then calls it custom).
 */
export function matchLook(theme: Theme): Look | undefined {
  const key = lookKey(theme);
  return Object.values(looks).find(
    (look) => lookKey(resolveTheme(defaultTheme, look.overrides)) === key,
  );
}
