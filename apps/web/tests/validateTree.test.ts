import { describe, expect, it } from 'vitest';
import { componentDefinitions } from '../lib/components/registry';
import { validateTree } from '../lib/components/validateTree';

const image = { url: 'https://picsum.photos/seed/a/800/500', alt: 'A photo' };

const section = (
  children: unknown[],
  props: Record<string, unknown> = {},
  id = 's1',
) => ({
  id,
  type: 'section',
  props: { columns: '1', background: 'none', ...props },
  children,
});
const cards = (items: unknown[], id = 'b1') => ({
  id,
  type: 'cards',
  props: {
    content: { from: 'items', items },
    layout: { arrange: 'grid' },
    style: { look: 'card', ratio: 'wide', showText: true },
  },
});

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
  it('accepts a Section of blocks and returns cleaned props', () => {
    const result = validateTree([
      section([cards([{ image, title: '  Our squad  ' }])], {
        columns: '1-1',
        background: 'primary',
        extra: 'dropped',
      }),
    ]);
    expect(result).toEqual({
      ok: true,
      tree: [
        {
          id: 's1',
          type: 'section',
          // align, padding and width were not stored: defaults fill them in.
          props: {
            columns: '1-1',
            align: 'stretch',
            background: 'primary',
            padding: 'md',
            width: 'full-background',
          },
          children: [cards([{ image, title: 'Our squad' }])],
        },
      ],
    });
  });

  it('reports item errors with the block id and the path inside its props', () => {
    const result = validateTree([section([cards([{ title: '' }])])]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.map((issue) => [issue.nodeId, issue.path.join('.')]),
    ).toEqual([
      ['b1', 'content.items.0.title'],
      ['b1', 'content.items.0.image'],
    ]);
  });

  it('checks a block against its type: written items need what it reads', () => {
    const result = validateTree([
      section([
        {
          id: 'n1',
          type: 'stats',
          props: {
            content: { from: 'items', items: [{ title: 'Titles' }] },
            layout: { arrange: 'carousel' },
            style: { size: 'l' },
          },
        },
      ]),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.path.join('.'))).toEqual([
      'content.items.0.value',
    ]);
  });

  it('only lets a block take items from a source that fills what it needs', () => {
    const block = (type: string, content: unknown, style = {}) => [
      section([
        {
          id: type,
          type,
          props: { content, layout: { arrange: 'grid' }, style },
        },
      ]),
    ];
    // News fills in a heading, text, an image and a link: cards can show it.
    expect(
      validateTree(
        block(
          'cards',
          { from: 'news', mode: 'latest', limit: 3 },
          { look: 'card', ratio: 'wide', showText: true },
        ),
      ).ok,
    ).toBe(true);
    // Numbers need a value, which news has not got.
    expect(
      validateTree(
        block(
          'stats',
          { from: 'news', mode: 'latest', limit: 3 },
          { size: 'l' },
        ),
      ).ok,
    ).toBe(false);
    // Matches only come from the fixtures service, never written by hand.
    expect(
      validateTree(
        block('matches', { from: 'items', items: [] }, { showVenue: true }),
      ).ok,
    ).toBe(false);
  });

  it('keeps the page shape: only Sections on the page, Sections can nest', () => {
    const nested = section([section([cards([])], {}, 's2')]);
    expect(validateTree([nested]).ok).toBe(true);
    const result = validateTree([cards([], 'loose')]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Only Sections can be placed directly on the page.',
    ]);
  });

  it('rejects unknown types, duplicate ids and children on blocks', () => {
    const result = validateTree([
      section([
        { id: 'x', type: 'mystery', props: {} },
        cards([], 'dup'),
        { ...cards([], 'dup'), children: [] },
      ]),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Unknown component type "mystery".',
      'Duplicate component id.',
      'Cards cannot contain other components.',
    ]);
  });
});
