import { describe, expect, it } from 'vitest';
import {
  differsFromPublished,
  editorReducer,
  initEditor,
  isDirty,
} from '../components/manager/editor/editorReducer';
import { createNode } from '../lib/components/createNode';
import { sectionSchema } from '../lib/components/section';
import { describeSchema } from '../lib/forms/describe';
import { summarizeProps } from '../lib/forms/summarize';

const start = () =>
  initEditor({ title: 'Home', description: '', path: '/', nav: {}, tree: [] });

describe('editorReducer', () => {
  it('tracks unsaved changes until the page is saved', () => {
    let state = start();
    expect(isDirty(state)).toBe(false);
    state = editorReducer(state, { type: 'setTitle', title: 'Welcome' });
    expect(isDirty(state)).toBe(true);
    state = editorReducer(state, { type: 'saved', draft: state.draft });
    expect(isDirty(state)).toBe(false);
  });

  it('inserts a block into a Section, selects it, and deselects when the Section is removed', () => {
    const section = createNode('section');
    const cards = createNode('cards');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: section,
      at: { index: 0 },
    });
    state = editorReducer(state, {
      type: 'insertNode',
      node: cards,
      at: { parentId: section.id, index: 0 },
    });
    expect(state.selectedId).toBe(cards.id);
    expect(state.draft.tree[0].children!.map((child) => child.id)).toEqual([
      cards.id,
    ]);
    state = editorReducer(state, { type: 'removeNode', id: section.id });
    expect(state.draft.tree).toEqual([]);
    expect(state.selectedId).toBeNull();
  });

  it('draws a block as another type in one undoable step, keeping its id and items', () => {
    const section = createNode('section');
    const cards = createNode('cards');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: { ...section, children: [cards] },
      at: { index: 0 },
    });
    const items = [{ title: 'Wallabies' }];
    state = editorReducer(state, {
      type: 'changeType',
      id: cards.id,
      nodeType: 'people',
      props: {
        content: { from: 'items', items },
        layout: cards.props.layout,
        style: {},
      },
    });
    const block = state.draft.tree[0].children![0];
    expect(block).toMatchObject({ id: cards.id, type: 'people' });
    expect(block.props.content).toEqual({ from: 'items', items });
    state = editorReducer(state, { type: 'undo' });
    expect(state.draft.tree[0].children![0].type).toBe('cards');
  });

  it('clears save errors once the tree is valid again', () => {
    const section = createNode('section');
    const text = createNode('text');
    let state = editorReducer(start(), {
      type: 'insertNode',
      node: { ...section, children: [text] },
      at: { index: 0 },
    });
    state = editorReducer(state, {
      type: 'saveFailed',
      issues: [{ nodeId: text.id, path: ['content'], message: 'x' }],
      pageErrors: {},
    });
    state = editorReducer(state, {
      type: 'updateProps',
      id: text.id,
      props: { ...text.props },
    });
    expect(state.issues).toEqual([]);
  });
});

describe('undo and redo', () => {
  it('steps back and forward through structural changes', () => {
    const a = createNode('section');
    const b = createNode('section');
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
  it('copies the default props; a Section starts empty', () => {
    const a = createNode('section');
    const b = createNode('cards');
    expect(a).toMatchObject({
      type: 'section',
      props: { columns: '1', background: 'none' },
      children: [],
    });
    expect(b).toMatchObject({
      type: 'cards',
      props: {
        content: { from: 'items', items: [] },
        layout: { arrange: 'grid' },
      },
    });
    expect(b).not.toHaveProperty('children');
    expect(a.id).not.toBe(b.id);
  });
});

describe('summarizeProps', () => {
  it('describes nodes for the outline', () => {
    expect(
      summarizeProps(describeSchema(sectionSchema), {
        columns: '1-1',
        background: 'primary',
      }),
    ).toBe('Two · Primary');
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
      nav: {},
      tree: [
        {
          id: 's',
          type: 'section',
          props: { columns: '1', background: 'none' },
          children: [
            {
              id: 'old',
              type: 'cards',
              props: { content: { from: 'items', items: 'x' } },
            },
          ],
        },
      ],
    });
    expect(state.issues.map((issue) => issue.nodeId)).toContain('old');
  });
});

describe('draft status', () => {
  const published = {
    title: 'Home',
    components: [],
    version: 1,
    publishedAt: '2026-11-21T00:00:00.000Z',
  };

  it('knows when the draft differs from what visitors see', () => {
    const draft = start().draft;
    expect(differsFromPublished(draft, null)).toBe(true);
    expect(differsFromPublished(draft, published)).toBe(false);
    expect(differsFromPublished({ ...draft, title: 'New' }, published)).toBe(
      true,
    );
  });

  it('starts afresh when the server replaces the draft (publish, discard, restore)', () => {
    let state = editorReducer(start(), { type: 'setTitle', title: 'Edited' });
    expect(state.past).toHaveLength(1);
    state = editorReducer(state, {
      type: 'loaded',
      draft: { ...state.draft, title: 'Restored' },
    });
    expect(state.draft.title).toBe('Restored');
    expect(isDirty(state)).toBe(false);
    expect(state.past).toEqual([]);
  });
});
