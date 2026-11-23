import type { FontName } from './fonts';

/** The full set of design tokens every site component can use. */
export type Theme = {
  colors: {
    brand: string;
    /** Text and icons placed on top of the brand colour. */
    brandContrast: string;
    background: string;
    surfaceLight: string;
    text: string;
    mutedText: string;
  };
  /** Corner radius of cards, images, buttons and panels. */
  radius: string;
  /** Fonts by name from lib/theme/fonts.ts. */
  fonts: { body: FontName; heading: FontName };
  /** Uppercase headings suit condensed sports fonts. */
  headingCase: 'normal' | 'uppercase';
  /** xs: inside a card; sm: between cards; md: between blocks; lg: around a Section. */
  spacing: { xs: string; sm: string; md: string; lg: string };
  /** Scales every spacing step at once: a site's "Spacing" setting. */
  density: 'compact' | 'standard' | 'roomy';
};

export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

/** What a site stores: only the tokens it changes. */
export type ThemeOverrides = DeepPartial<Theme>;
