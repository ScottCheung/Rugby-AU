import { describe, expect, it } from 'vitest';
import { imageSchema, isImageAddress } from '../lib/components/fields';

describe('isImageAddress', () => {
  it('accepts web addresses and paths on this site', () => {
    expect(isImageAddress('https://images.unsplash.com/photo-1')).toBe(true);
    expect(isImageAddress('/players/len-ikitau.webp')).toBe(true);
  });

  it('rejects anything else', () => {
    for (const value of [
      '',
      'players/x.webp',
      '//evil.example/x.png',
      'javascript:alert(1)',
    ])
      expect(isImageAddress(value), value).toBe(false);
  });

  it('is what the image field validates with', () => {
    expect(
      imageSchema.safeParse({ url: '/players/x.webp', alt: 'A player' })
        .success,
    ).toBe(true);
    expect(
      imageSchema.safeParse({ url: 'ftp://x', alt: 'A player' }).success,
    ).toBe(false);
  });
});
