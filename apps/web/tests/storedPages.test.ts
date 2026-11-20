import { describe, expect, it } from 'vitest';
import { validateTree } from '../lib/components/validateTree';
import { componentDefinitions } from '../lib/components/registry';
import storedPage from './fixtures/stored-page-v1.json';

/**
 * Pages in MongoDB were saved under older versions of the component
 * schemas, and nothing migrates them. So a new prop must be .optional() or
 * have a .default(); a new required prop would make these pages invalid,
 * and the renderer would skip those blocks. If this test fails, that is
 * what happened.
 */
describe('pages stored under older schemas', () => {
  it('still pass validation', () => {
    const result = validateTree(storedPage.tree);
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it('get the defaults of props added later', () => {
    const result = validateTree(storedPage.tree);
    if (!result.ok) throw new Error('invalid');
    const [slider, section] = result.tree;
    expect(slider.props.autoplay).toBe(false);
    expect(section.children?.[0].props.variant).toBe('grid');
  });

  it('cover every component in the library', () => {
    const types = new Set<string>();
    const walk = (nodes: { type: string; children?: unknown[] }[]) => {
      for (const node of nodes) {
        types.add(node.type);
        walk((node.children ?? []) as typeof nodes);
      }
    };
    walk(storedPage.tree);
    for (const definition of componentDefinitions)
      expect(types, `add a ${definition.type} block to the fixture`).toContain(
        definition.type,
      );
  });
});

describe('a block missing a required prop', () => {
  it('gets a message an editor can act on', () => {
    const result = validateTree([
      { id: 'old', type: 'cardGrid', props: { cards: [] } },
    ]);
    expect(result.ok ? [] : result.issues).toEqual([
      { nodeId: 'old', path: ['title'], message: 'This field is required.' },
    ]);
  });
});
