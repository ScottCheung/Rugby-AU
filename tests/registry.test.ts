import { describe, expect, it } from 'vitest';
import { createInstance, parseComponentTree } from '../lib/components/registry';
import { pages } from '../lib/seed-data';
import { defaultValueFor } from '../lib/schema';
import { cardGrid } from '../lib/components/card-grid';

describe('parseComponentTree', () => {
  it('accepts every seed page', () => {
    for (const page of pages) expect(parseComponentTree(page.components).ok).toBe(true);
  });

  it('applies defaults to new components', () => {
    const result = parseComponentTree([createInstance('section', 's1')]);
    expect(result).toEqual({
      ok: true,
      components: [
        { id: 's1', type: 'section', props: { layout: 'full', background: 'none' }, children: [] },
      ],
    });
  });

  it('reports nested prop errors with the component id and path', () => {
    const grid = createInstance('card-grid', 'g1');
    grid.props.cards = [{ image: { url: 'not-a-url', alt: '' }, heading: '' }];
    const result = parseComponentTree([
      { ...createInstance('section', 's1'), children: [grid] },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => [i.componentId, i.path.join('.')])).toEqual([
      ['g1', 'cards.0.image.url'],
      ['g1', 'cards.0.heading'],
    ]);
  });

  it('rejects unknown types, duplicate ids and children on leaf components', () => {
    const result = parseComponentTree([
      { id: 'a', type: 'carousel', props: {} },
      { ...createInstance('card-grid', 'b'), children: [] },
      createInstance('section', 'b'),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.message)).toEqual([
      'Unknown component type "carousel".',
      'Card Grid cannot contain other components.',
      'Duplicate id.',
    ]);
  });

  it('allows an optional link to be omitted but validates it when present', () => {
    const card = { image: { url: '', alt: '' }, heading: 'Squad' };
    const ok = cardGrid.props.safeParse({ title: 'T', cards: [card] });
    const bad = cardGrid.props.safeParse({ title: 'T', cards: [{ ...card, link: { href: '' } }] });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('defaultValueFor', () => {
  it('builds a new list item from the schema, leaving optional fields out', () => {
    const cardSchema = cardGrid.props.shape.cards.unwrap().element;
    expect(defaultValueFor(cardSchema)).toEqual({ image: { url: '', alt: '' }, heading: '' });
  });
});
