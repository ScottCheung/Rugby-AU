import { describe, expect, it } from 'vitest';
import { componentDefinitions } from '../lib/components/registry';
import { validateTree } from '../lib/components/validateTree';

const card = {
  image: { url: 'https://picsum.photos/seed/a/800/500', alt: 'A photo' },
  heading: '  Our squad  ',
};

describe('component definitions', () => {
  it.each(componentDefinitions)(
    '$type default props satisfy its own schema',
    (definition) => {
      expect(definition.schema.safeParse(definition.defaultProps).success).toBe(
        true,
      );
    },
  );
});

describe('validateTree', () => {
  it('accepts a nested tree and returns cleaned props', () => {
    const result = validateTree([
      {
        id: 's1',
        type: 'section',
        props: { layout: 'two-column', background: 'brand', extra: 'dropped' },
        children: [
          {
            id: 'g1',
            type: 'cardGrid',
            props: { title: 'Team', cards: [card] },
          },
        ],
      },
    ]);
    expect(result).toEqual({
      ok: true,
      tree: [
        {
          id: 's1',
          type: 'section',
          props: { layout: 'two-column', background: 'brand' },
          children: [
            {
              id: 'g1',
              type: 'cardGrid',
              props: {
                title: 'Team',
                cards: [{ ...card, heading: 'Our squad' }],
              },
            },
          ],
        },
      ],
    });
  });

  it('reports field errors with the node id and the path inside its props', () => {
    const result = validateTree([
      {
        id: 's1',
        type: 'section',
        props: { layout: 'full', background: 'none' },
        children: [
          {
            id: 'g1',
            type: 'cardGrid',
            props: {
              title: 'Team',
              cards: [
                {
                  image: { url: 'javascript:alert(1)', alt: 'x' },
                  heading: '',
                  link: { label: 'Go', href: '' },
                },
              ],
            },
          },
        ],
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.map((issue) => [issue.nodeId, issue.path.join('.')]),
    ).toEqual([
      ['g1', 'cards.0.image.url'],
      ['g1', 'cards.0.heading'],
      ['g1', 'cards.0.link.href'],
    ]);
  });

  it('allows the optional link to be left out', () => {
    const result = validateTree([
      { id: 'g1', type: 'cardGrid', props: { title: '', cards: [card] } },
    ]);
    expect(result.ok).toBe(true);
  });

  it('rejects unknown types, duplicate ids and children on leaf components', () => {
    const result = validateTree([
      { id: 'a', type: 'carousel', props: {} },
      {
        id: 'b',
        type: 'cardGrid',
        props: { title: '', cards: [] },
        children: [],
      },
      {
        id: 'b',
        type: 'section',
        props: { layout: 'full', background: 'none' },
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Unknown component type "carousel".',
      'Card Grid cannot contain other components.',
      'Duplicate component id.',
    ]);
  });
});
