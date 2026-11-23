import { describe, expect, it } from 'vitest';
import { sameItem } from '../lib/components/items';

describe('sameItem', () => {
  it('compares items by list and place, or by id', () => {
    expect(
      sameItem({ field: 'cards', index: 1 }, { field: 'cards', index: 1 }),
    ).toBe(true);
    expect(
      sameItem({ field: 'cards', index: 1 }, { field: 'cards', index: 2 }),
    ).toBe(false);
    expect(
      sameItem(
        { field: 'articles', ref: 'x' },
        { field: 'articles', ref: 'x' },
      ),
    ).toBe(true);
    expect(sameItem({ field: 'cards', index: 0 }, null)).toBe(false);
  });
});
