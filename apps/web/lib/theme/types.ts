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
  radius: string;
  fontFamily: string;
  spacing: { sm: string; md: string; lg: string };
};

export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

/** What a site stores: only the tokens it changes. */
export type ThemeOverrides = DeepPartial<Theme>;
