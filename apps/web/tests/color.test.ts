import { describe, expect, it } from 'vitest';
import { averageBottom, cardShade, contrast, toHex } from '../lib/color';

/** A width x height image whose top half is one colour, bottom half another. */
function twoTone(top: number[], bottom: number[], width = 4, height = 10) {
  const pixels = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      pixels.set(y < height / 2 ? top : bottom, (y * width + x) * 3);
  return pixels;
}

describe('averageBottom', () => {
  it('reads only the bottom of the image, where the card colour meets it', () => {
    const pixels = twoTone([255, 255, 255], [200, 40, 40]);
    expect(averageBottom(pixels, 4, 10, 0.6)).toEqual([200, 40, 40]);
  });
});

describe('cardShade', () => {
  it('keeps the hue of a light colour but darkens it', () => {
    const [r, g, b] = cardShade([250, 200, 200]);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('always leaves white text readable (contrast of at least 4.5)', () => {
    const samples: [number, number, number][] = [
      [250, 200, 200],
      [255, 255, 0],
      [0, 255, 255],
      [120, 220, 120],
      [255, 255, 255],
      [200, 120, 40],
      [40, 80, 200],
    ];
    for (const sample of samples)
      expect(
        contrast(cardShade(sample), [255, 255, 255]),
        String(sample),
      ).toBeGreaterThanOrEqual(4.5);
  });

  it('lifts pure black a little, so the card still has a colour', () => {
    expect(cardShade([0, 0, 0])).toEqual([51, 51, 51]);
  });
});

describe('toHex', () => {
  it('writes six-digit hex', () => {
    expect(toHex([31, 41, 5])).toBe('#1f2905');
  });
});
