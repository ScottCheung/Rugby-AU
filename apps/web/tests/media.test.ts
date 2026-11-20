import { describe, expect, it } from 'vitest';
import { collectImages } from '../lib/media';
import type { ComponentNode } from '../lib/types';

const image = (name: string) => ({
  url: `https://example.com/${name}.jpg`,
  alt: name,
});

describe('collectImages', () => {
  it('finds images at any depth, once each, across pages', () => {
    const home: ComponentNode[] = [
      {
        id: 'slider',
        type: 'imageSlider',
        props: { slides: [{ image: image('a'), heading: 'A' }] },
      },
      {
        id: 'section',
        type: 'section',
        props: { layout: 'full', background: 'none' },
        children: [
          {
            id: 'grid',
            type: 'cardGrid',
            props: {
              title: '',
              cards: [
                { image: image('b'), heading: 'B' },
                { image: image('a'), heading: 'A again' },
              ],
            },
          },
        ],
      },
    ];
    const about: ComponentNode[] = [
      {
        id: 'grid',
        type: 'cardGrid',
        props: { title: '', cards: [{ image: image('c'), heading: 'C' }] },
      },
    ];
    expect(collectImages([home, about]).map((found) => found.alt)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('ignores links and images without a web address', () => {
    const tree: ComponentNode[] = [
      {
        id: 'grid',
        type: 'cardGrid',
        props: {
          title: '',
          cards: [
            {
              image: { url: '', alt: 'draft' },
              heading: 'Draft',
              link: { label: 'Read', href: '/about' },
            },
          ],
        },
      },
    ];
    expect(collectImages([tree])).toEqual([]);
  });
});
