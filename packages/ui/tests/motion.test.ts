import { describe, expect, it } from 'vitest';
import { cssEase, ease, entrance, stagger, timing } from '../src/motion';

describe('motion presets', () => {
  it('staggers siblings by timing.step, never waiting more than maxDelay', () => {
    expect([0, 1, 2].map((index) => stagger(index))).toEqual([0, 0.15, 0.3]);
    expect(stagger(20)).toBe(timing.maxDelay);
    expect(stagger(2, 0.1)).toBe(0.2);
  });

  it('uses one easing curve for Motion and for CSS', () => {
    expect(ease).toEqual([0.4, 0, 0.2, 1]);
    expect(cssEase).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('enters from a small, softened offset to rest', () => {
    expect(entrance.hidden).toEqual({ opacity: 0, y: 12, filter: 'blur(4px)' });
    expect(entrance.shown).toEqual({ opacity: 1, y: 0, filter: 'blur(0px)' });
  });
});

describe('stagger-in', () => {
  it('has a look per arrangement, each landing at rest', async () => {
    const { staggerIn, settled } = await import('../src/motion');
    expect(Object.keys(staggerIn).sort()).toEqual(
      ['carousel', 'featured', 'grid', 'list', 'slider', 'wall'],
    );
    for (const { from, step } of Object.values(staggerIn)) {
      expect(from.opacity).toBe(0);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(timing.step);
    }
    expect(settled).toEqual({ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' });
  });
});
