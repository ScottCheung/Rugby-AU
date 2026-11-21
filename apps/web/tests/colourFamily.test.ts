import { describe, expect, it } from 'vitest';
import { sites } from '../scripts/seed/sites';
import { colourFamily } from '../lib/theme/colourFamily';

describe('colourFamily', () => {
  it('puts the seeded brand colours where a reader would', () => {
    const family = (slug: string) =>
      colourFamily(
        sites.find((site) => site.slug === slug)!.theme.colors!.brand!,
      );
    expect(family('rugby-australia')).toBe('navy');
    expect(family('brumbies')).toBe('navy');
    expect(family('waratahs')).toBe('blue');
    expect(family('reds')).toBe('red');
    expect(family('rugby-south-australia')).toBe('red');
    expect(family('australia-sevens')).toBe('green');
  });

  it('keeps dark navy apart from sky blue', () => {
    expect(colourFamily('#0b2240')).toBe('navy');
    expect(colourFamily('#4fb3e8')).toBe('blue');
  });

  it('treats near-black, greys and unreadable values as black and grey', () => {
    expect(colourFamily('#111111')).toBe('black');
    expect(colourFamily('#777777')).toBe('black');
    expect(colourFamily('not a colour')).toBe('black');
  });

  it('places gold, orange and maroon', () => {
    expect(colourFamily('#f6c300')).toBe('gold');
    expect(colourFamily('#b5541f')).toBe('orange');
    expect(colourFamily('#7b1e2b')).toBe('red');
  });
});
