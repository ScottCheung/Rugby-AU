import { describe, expect, it } from 'vitest';
import {
  editorReducer,
  initEditor,
  isDirty,
} from '../components/manager/editorReducer';
import { createNode } from '../lib/components/createNode';
import { summarizeProps } from '../lib/forms/summarize';
import { describeSchema } from '../lib/forms/describe';
import { cardGridSchema } from '../lib/components/cardGrid';
import { sectionSchema } from '../lib/components/section';

const start = () => initEditor({ title: 'Home', description: '', tree: [] });

describe('editorReducer', () => {
  it('tracks unsaved changes until the page is saved', () => {
    let state = start();
    expect(isDirty(state)).toBe(false);
    state = editorReducer(state, { type: 'setTitle', title: 'Welcome' });
    expect(isDirty(state)).toBe(true);
    state = editorReducer(state, { type: 'saved', draft: state.draft });
    expect(isDirty(state)).toBe(false);
  });

  it('adds nested nodes, selects them, and deselects when their parent is removed', () => {
    const section = createNode('section');
    const grid = createNode('cardGrid');
    let state = editorReducer(start(), { type: 'addNode', node: section });
    state = editorReducer(state, {
      type: 'addNode',
      node: grid,
      parentId: section.id,
    });
    expect(state.draft.tree[0].children?.[0].id).toBe(grid.id);
    expect(state.selectedId).toBe(grid.id);
    state = editorReducer(state, { type: 'removeNode', id: section.id });
    expect(state.draft.tree).toEqual([]);
    expect(state.selectedId).toBeNull();
  });

  it('clears save errors once the tree is valid again', () => {
    const grid = createNode('cardGrid');
    let state = editorReducer(start(), { type: 'addNode', node: grid });
    state = editorReducer(state, {
      type: 'saveFailed',
      issues: [{ nodeId: grid.id, path: ['title'], message: 'x' }],
      pageErrors: {},
    });
    state = editorReducer(state, {
      type: 'updateProps',
      id: grid.id,
      props: { title: 'Ok', cards: [] },
    });
    expect(state.issues).toEqual([]);
  });
});

describe('createNode', () => {
  it('copies the default props and gives containers a children list', () => {
    const a = createNode('section');
    const b = createNode('cardGrid');
    expect(a).toMatchObject({
      type: 'section',
      props: { layout: 'full', background: 'none' },
      children: [],
    });
    expect(b).not.toHaveProperty('children');
    expect(a.id).not.toBe(b.id);
  });
});

describe('summarizeProps', () => {
  it('describes nodes for the outline', () => {
    expect(
      summarizeProps(describeSchema(sectionSchema), {
        layout: 'two-column',
        background: 'brand',
      }),
    ).toBe('Two columns · Brand colour');
    expect(
      summarizeProps(describeSchema(cardGridSchema), {
        title: 'Squad',
        cards: [{}],
      }),
    ).toBe('Squad · 1 card');
  });
});
