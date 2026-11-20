import { describe, expect, it } from 'vitest';
import { animatesAsWhole, stagger } from '../lib/motion';

describe('entrance animation rules', () => {
  it('staggers siblings 0.15s apart, never waiting more than 0.6s', () => {
    expect([0, 1, 2].map((index) => stagger(index))).toEqual([0, 0.15, 0.3]);
    expect(stagger(20)).toBe(0.6);
  });

  it('animates content once: containers and card lists animate their items', () => {
    expect(animatesAsWhole('textBlock')).toBe(true);
    expect(animatesAsWhole('stats')).toBe(true);
    expect(animatesAsWhole('section')).toBe(false);
    expect(animatesAsWhole('cardGrid')).toBe(false);
    expect(animatesAsWhole('latestNews')).toBe(false);
  });
});
