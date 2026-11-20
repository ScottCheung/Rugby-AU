import { describe, expect, it } from 'vitest';
import { sectionPadding } from '../lib/components/section';

describe('sectionPadding', () => {
  it('uses the chosen padding whatever the width', () => {
    for (const width of ['contained', 'full-background', 'full-width'] as const)
      expect(sectionPadding({ padding: 'lg', width })).toBe('lg');
  });

  it('defaults to medium, and to none for edge-to-edge sections', () => {
    expect(sectionPadding({ width: 'contained' })).toBe('md');
    expect(sectionPadding({ width: 'full-background' })).toBe('md');
    expect(sectionPadding({ width: 'full-width' })).toBe('none');
  });

  it('does not take the background into account', () => {
    // The background is not even an input: switching colours cannot change
    // the space inside a section.
    expect(sectionPadding.length).toBe(1);
    const input = { width: 'contained' as const, background: 'brand' };
    expect(sectionPadding(input)).toBe(sectionPadding({ width: 'contained' }));
  });
});
