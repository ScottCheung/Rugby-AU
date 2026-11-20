import { describe, expect, it } from 'vitest';
import { rootBlockWidth } from '../lib/components/pageWidth';

describe('rootBlockWidth', () => {
  it('lets a Section choose its width', () => {
    for (const width of ['contained', 'full-background', 'full-width'])
      expect(
        rootBlockWidth({
          id: 's',
          type: 'section',
          props: { layout: 'full', background: 'brand', width },
        }),
      ).toBe(width);
  });

  it('keeps Sections saved before the width prop, and other blocks, in the page column', () => {
    expect(
      rootBlockWidth({
        id: 's',
        type: 'section',
        props: { layout: 'full', background: 'none' },
      }),
    ).toBe('contained');
    expect(
      rootBlockWidth({
        id: 'c',
        type: 'cardGrid',
        props: { title: '', cards: [], width: 'full-width' },
      }),
    ).toBe('contained');
  });
});
