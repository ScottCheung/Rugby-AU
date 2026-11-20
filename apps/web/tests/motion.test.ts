import { describe, expect, it } from 'vitest';
import { animatesAsWhole } from '../lib/motion';

describe('entrance animation rules', () => {
  it('animates content once: containers and card lists animate their items', () => {
    expect(animatesAsWhole('textBlock')).toBe(true);
    expect(animatesAsWhole('stats')).toBe(true);
    expect(animatesAsWhole('section')).toBe(false);
    expect(animatesAsWhole('cardGrid')).toBe(false);
    expect(animatesAsWhole('latestNews')).toBe(false);
  });
});
