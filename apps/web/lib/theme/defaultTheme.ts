import type { Theme } from './types';

/** Shared defaults. Sites override only what makes their brand. */
export const defaultTheme: Theme = {
  colors: {
    brand: '#1f5f46',
    brandContrast: '#ffffff',
    background: '#ffffff',
    surfaceLight: '#f1f4f2',
    text: '#14201b',
    mutedText: '#5b6863',
  },
  radius: '0.75rem',
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  spacing: { sm: '1rem', md: '2rem', lg: '4rem' },
};
