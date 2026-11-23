import { z } from 'zod';
import { contrast, type Rgb } from '../color';
import { isImageAddress, linkSchema } from '../components/fields';
import { defaultTheme } from '../theme/defaultTheme';
import { fontStacks } from '../theme/fonts';
import { looks, matchLook } from '../theme/looks';
import { resolveTheme } from '../theme/resolveTheme';
import type { Site } from '../types';
import '../components/editorMeta';

/**
 * What an editor can change about a whole site, as one form (generated
 * like a component's, from this schema). Everything visual is a choice
 * from the site's options, never free values: a look (fonts, corners,
 * spacing) and one brand colour, whose text colour is picked for contrast.
 */

type LookId = keyof typeof looks;
const lookIds = Object.keys(looks) as [LookId, ...LookId[]];

const imageAddress = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isImageAddress(value),
    'Enter a full image address (https://…) or a path on this site (/…)',
  );

/** A colour a site sets: #rrggbb, picked with a swatch or typed. */
const colour = (label: string, hint: string) =>
  z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, 'Use a colour like #1f6f43')
    .meta({ group: 'style', label, hint, format: 'color' });

export const siteSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the site a name')
    .max(60, 'Keep the name under 60 characters')
    .meta({ label: 'Name' }),
  tagline: z.string().trim().max(160, 'Keep it under 160 characters').meta({
    label: 'Description',
    hint: 'One line about the site, shown in the footer.',
    multiline: true,
  }),
  logoUrl: imageAddress.optional().meta({
    label: 'Logo',
    format: 'image',
    hint: 'Without one the site shows its initials.',
  }),
  faviconUrl: imageAddress.optional().meta({
    label: 'Favicon',
    format: 'image',
    hint: 'The small icon in the browser tab.',
  }),
  headerButton: linkSchema.optional().meta({
    label: 'Header button',
    hint: 'A call to action at the end of the menu, e.g. Buy tickets.',
  }),
  footerLinks: z.array(linkSchema).max(8, 'At most 8 footer links').meta({
    label: 'Footer links',
    itemLabel: 'Link',
    hint: 'Social media and other links under the site menu.',
  }),
  look: z.enum(lookIds).meta({
    group: 'style',
    label: 'Look',
    hint: 'Fonts, corners and spacing, shared with other sites of its kind.',
    optionLabels: Object.fromEntries(
      Object.values(looks).map((look) => [look.id, look.name]),
    ),
    optionDescriptions: Object.fromEntries(
      Object.values(looks).map((look) => [look.id, look.description]),
    ),
    // Each card shows the look's own heading font, case and corners.
    optionSamples: Object.fromEntries(
      Object.values(looks).map((look) => [
        look.id,
        {
          font: fontStacks[look.overrides.fonts.heading],
          uppercase:
            'headingCase' in look.overrides &&
            look.overrides.headingCase === 'uppercase',
          radius: look.overrides.radius,
        },
      ]),
    ),
  }),
  density: z.enum(['compact', 'standard', 'roomy']).meta({
    group: 'layout',
    label: 'Spacing',
    hint: 'Room between cards, blocks and sections, on every page.',
    optionLabels: {
      compact: 'Compact',
      standard: 'Standard',
      roomy: 'Roomy',
    },
  }),
  // The colours a site sets. Text on the brand colour is not a setting: it
  // is chosen to stay readable (contrastColour).
  brand: colour('Brand colour', 'Header, buttons and bands.'),
  background: colour('Background', 'The page behind everything.'),
  surfaceLight: colour('Light surface', 'Panels and bands in the light tone.'),
  text: colour('Text', 'Headings and body text.'),
  mutedText: colour('Secondary text', 'Captions, dates and hints.'),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/** The form's starting values for a site. */
export function settingsFromSite(site: Site): SiteSettings {
  const theme = resolveTheme(defaultTheme, site.theme);
  return {
    name: site.name,
    tagline: site.tagline,
    ...(site.logoUrl ? { logoUrl: site.logoUrl } : {}),
    ...(site.faviconUrl ? { faviconUrl: site.faviconUrl } : {}),
    ...(site.headerButton ? { headerButton: site.headerButton } : {}),
    footerLinks: site.footerLinks ?? [],
    look: (matchLook(theme)?.id as LookId | undefined) ?? 'official',
    density: theme.density,
    brand: theme.colors.brand,
    background: theme.colors.background,
    surfaceLight: theme.colors.surfaceLight,
    text: theme.colors.text,
    mutedText: theme.colors.mutedText,
  };
}

const toRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Text on the brand colour needs at least this contrast (WCAG AA). */
export const MIN_CONTRAST = 4.5;

const isHex = (colour?: string): colour is string =>
  !!colour && /^#[0-9a-f]{6}$/i.test(colour);

/**
 * The colour for text on `brand`, in order of preference:
 * 1. the site's current one, while it stays readable (a hand-picked
 *    pairing such as dark green on gold survives a small change);
 * 2. the most readable of the site's own colours (`palette`: its
 *    background and text), so changing the brand and changing it back
 *    returns to the same pairing;
 * 3. white or near-black, whichever reads better.
 * Undefined if nothing reaches MIN_CONTRAST.
 */
export function contrastColour(
  brand: string,
  current?: string,
  palette: string[] = [],
): string | undefined {
  const readable = (colour: string) =>
    contrast(toRgb(brand), toRgb(colour)) >= MIN_CONTRAST;
  const best = (colours: string[]) =>
    colours
      .filter(isHex)
      .filter(readable)
      .sort(
        (a, b) =>
          contrast(toRgb(brand), toRgb(b)) - contrast(toRgb(brand), toRgb(a)),
      )[0];
  if (isHex(current) && readable(current)) return current;
  return best(palette) ?? best(['#ffffff', '#111111']);
}

/**
 * The site with these settings applied: identity and links as given, the
 * theme rebuilt from the look plus the site's own colours (brand and its
 * text colour replaced). Pure, so the editor's preview and the save use
 * the same result.
 */
export function applySettings(site: Site, settings: SiteSettings): Site {
  const current = resolveTheme(defaultTheme, site.theme).colors;
  const colors = {
    brand: settings.brand,
    background: settings.background,
    surfaceLight: settings.surfaceLight,
    text: settings.text,
    mutedText: settings.mutedText,
  };
  // The text on the brand colour is picked against this site's own
  // background and text, so the pairing stays readable with any of them.
  const brandContrast =
    contrastColour(colors.brand, current.brandContrast, [
      colors.background,
      colors.text,
    ]) ?? current.brandContrast;
  const look = looks[settings.look];
  const next: Site = {
    ...site,
    name: settings.name,
    tagline: settings.tagline,
    theme: {
      ...look.overrides,
      density: settings.density,
      colors: { ...site.theme.colors, ...colors, brandContrast },
    },
    footerLinks: settings.footerLinks,
  };
  for (const key of ['logoUrl', 'faviconUrl', 'headerButton'] as const) {
    const value = settings[key];
    if (value) (next as Record<string, unknown>)[key] = value;
    else delete next[key];
  }
  return next;
}
