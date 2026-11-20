import { describe, expect, it } from 'vitest';
import {
  editorReducer,
  initEditor,
  isDirty,
} from '../components/manager/editor/editorReducer';
import { cardGridSchema } from '../lib/components/cardGrid';
import { createNode } from '../lib/components/createNode';
import { sectionSchema } from '../lib/components/section';
import { describeSchema } from '../lib/forms/describe';
import { summarizeProps } from '../lib/forms/summarize';

const start = () =>
  initEditor({ title: 'Home', description: '', path: '/', tree: [] });

describe('editorReducer', () => {
  it('tracks unsaved changes until the page is saved', () => {
    let state = start();
    expect(isDirty(state)).toBe(false);
    state = editorReducer(state, { type: 'setTitle', title: 'Welcome' });
    expect(isDirty(state)).toBe(true);
    state = editorReducer(state, { type: 'saved', draft: state.draft });
    expect(isDirty(state)).toBe(false);
  });

  it('inserts nested nodes, selects them, and deselects when their parent is removed', () => {
    const section = createNode('section');
    const grid = createNode('cardGrid');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: section,
      at: { index: 0 },
    });
    state = editorReducer(state, {
      type: 'insertNode',
      node: grid,
      at: { parentId: section.id, index: 0 },
    });
    expect(state.draft.tree[0].children?.[0].id).toBe(grid.id);
    expect(state.selectedId).toBe(grid.id);
    state = editorReducer(state, { type: 'removeNode', id: section.id });
    expect(state.draft.tree).toEqual([]);
    expect(state.selectedId).toBeNull();
  });

  it('moves a node into a section', () => {
    const section = createNode('section');
    const grid = createNode('cardGrid');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: section,
      at: { index: 0 },
    });
    state = editorReducer(state, {
      type: 'insertNode',
      node: grid,
      at: { index: 1 },
    });
    state = editorReducer(state, {
      type: 'moveNode',
      id: grid.id,
      to: { parentId: section.id, index: 0 },
    });
    expect(state.draft.tree).toHaveLength(1);
    expect(state.draft.tree[0].children?.[0].id).toBe(grid.id);
  });

  it('clears save errors once the tree is valid again', () => {
    const grid = createNode('cardGrid');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: grid,
      at: { index: 0 },
    });
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

describe('undo and redo', () => {
  it('steps back and forward through structural changes', () => {
    const a = createNode('section');
    const b = createNode('cardGrid');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: a,
      at: { index: 0 },
    });
    state = editorReducer(state, {
      type: 'insertNode',
      node: b,
      at: { index: 1 },
    });
    state = editorReducer(state, { type: 'undo' });
    expect(state.draft.tree.map((node) => node.id)).toEqual([a.id]);
    expect(state.selectedId).toBeNull(); // b no longer exists
    state = editorReducer(state, { type: 'redo' });
    expect(state.draft.tree.map((node) => node.id)).toEqual([a.id, b.id]);
  });

  it('merges consecutive edits of the same field into one step', () => {
    let state = start();
    for (const title of ['W', 'We', 'Wel', 'Welcome'])
      state = editorReducer(state, { type: 'setTitle', title });
    expect(state.past).toHaveLength(1);
    state = editorReducer(state, { type: 'undo' });
    expect(state.draft.title).toBe('Home');
    expect(editorReducer(state, { type: 'undo' })).toBe(state); // nothing left to undo
  });

  it('a new change clears the redo stack', () => {
    let state = editorReducer(start(), { type: 'setTitle', title: 'A' });
    state = editorReducer(state, { type: 'undo' });
    state = editorReducer(state, { type: 'setDescription', description: 'B' });
    expect(state.future).toEqual([]);
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
        variant: 'carousel',
        cards: [{}],
      }),
    ).toBe('Squad · Carousel');
    // Older data without the variant: nothing is made up.
    expect(
      summarizeProps(describeSchema(cardGridSchema), {
        title: 'Squad',
        cards: [{}],
      }),
    ).toBe('Squad · 1 card');
  });
});

describe('page settings and stored pages', () => {
  it('changes the address as one undoable edit', () => {
    let state = start();
    state = editorReducer(state, { type: 'setPath', path: '/a' });
    state = editorReducer(state, { type: 'setPath', path: '/ab' });
    expect(state.draft.path).toBe('/ab');
    expect(isDirty(state)).toBe(true);
    state = editorReducer(state, { type: 'undo' });
    expect(state.draft.path).toBe('/');
  });

  it('flags blocks that no longer match their schema as soon as it opens', () => {
    const state = initEditor({
      title: 'Home',
      description: '',
      path: '/',
      tree: [{ id: 'old', type: 'cardGrid', props: { cards: 'not a list' } }],
    });
    expect(state.issues.map((issue) => issue.nodeId)).toContain('old');
  });
});
