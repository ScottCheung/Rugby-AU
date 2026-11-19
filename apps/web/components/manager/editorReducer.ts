import {
  findNode,
  insertNode,
  moveNode,
  removeNode,
  updateNodeProps,
  type Location,
} from '@/lib/components/tree';
import { validateTree, type TreeIssue } from '@/lib/components/validateTree';
import type { ComponentNode } from '@/lib/types';

/** The part of the page the editor changes. */
export type Draft = {
  title: string;
  description: string;
  tree: ComponentNode[];
};

export type PageErrors = { title?: string; description?: string };

export type EditorState = {
  draft: Draft;
  /** The draft as last saved, serialised, to detect unsaved changes. */
  savedSnapshot: string;
  selectedId: string | null;
  /** Problems reported by the last save; cleared as they get fixed. */
  issues: TreeIssue[];
  pageErrors: PageErrors;
  /** Undo / redo stacks of earlier and undone drafts. */
  past: Draft[];
  future: Draft[];
  /** Typing in one field produces many edits; they share one undo step. */
  lastEditKey: string | null;
};

export type EditorAction =
  | { type: 'setTitle'; title: string }
  | { type: 'setDescription'; description: string }
  | { type: 'insertNode'; node: ComponentNode; at: Location }
  | { type: 'moveNode'; id: string; to: Location }
  | { type: 'removeNode'; id: string }
  | { type: 'updateProps'; id: string; props: Record<string, unknown> }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saveFailed'; issues: TreeIssue[]; pageErrors: PageErrors }
  | { type: 'saved'; draft: Draft };

const HISTORY_LIMIT = 100;

export function initEditor(draft: Draft): EditorState {
  return {
    draft,
    savedSnapshot: JSON.stringify(draft),
    selectedId: null,
    issues: [],
    pageErrors: {},
    past: [],
    future: [],
    lastEditKey: null,
  };
}

export const isDirty = (state: EditorState) =>
  JSON.stringify(state.draft) !== state.savedSnapshot;

/** After a failed save, re-check on every change so fixed fields lose their error. */
function recheck(state: EditorState): EditorState {
  if (state.issues.length === 0) return state;
  const result = validateTree(state.draft.tree);
  return { ...state, issues: result.ok ? [] : result.issues };
}

/** Apply a new draft and record the old one for undo. */
function commit(
  state: EditorState,
  draft: Draft,
  editKey: string | null = null,
): EditorState {
  const sameEdit = editKey !== null && editKey === state.lastEditKey;
  return recheck({
    ...state,
    draft,
    past: sameEdit
      ? state.past
      : [...state.past, state.draft].slice(-HISTORY_LIMIT),
    future: [],
    lastEditKey: editKey,
  });
}

/** Keep the selection only if that node still exists. */
function keepSelection(state: EditorState): EditorState {
  const exists =
    state.selectedId !== null && findNode(state.draft.tree, state.selectedId);
  return exists ? state : { ...state, selectedId: null };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  const { draft } = state;
  switch (action.type) {
    case 'setTitle':
      return {
        ...commit(state, { ...draft, title: action.title }, 'title'),
        pageErrors: { ...state.pageErrors, title: undefined },
      };
    case 'setDescription':
      return {
        ...commit(
          state,
          { ...draft, description: action.description },
          'description',
        ),
        pageErrors: { ...state.pageErrors, description: undefined },
      };
    case 'insertNode':
      return {
        ...commit(state, {
          ...draft,
          tree: insertNode(draft.tree, action.node, action.at),
        }),
        selectedId: action.node.id,
      };
    case 'moveNode':
      return commit(state, {
        ...draft,
        tree: moveNode(draft.tree, action.id, action.to),
      });
    case 'removeNode':
      return keepSelection(
        commit(state, { ...draft, tree: removeNode(draft.tree, action.id) }),
      );
    case 'updateProps':
      return commit(
        state,
        {
          ...draft,
          tree: updateNodeProps(draft.tree, action.id, action.props),
        },
        `props:${action.id}`,
      );
    case 'select':
      return { ...state, selectedId: action.id, lastEditKey: null };
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return keepSelection(
        recheck({
          ...state,
          draft: previous,
          past: state.past.slice(0, -1),
          future: [draft, ...state.future],
          lastEditKey: null,
        }),
      );
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return keepSelection(
        recheck({
          ...state,
          draft: next,
          past: [...state.past, draft],
          future: rest,
          lastEditKey: null,
        }),
      );
    }
    case 'saveFailed':
      return { ...state, issues: action.issues, pageErrors: action.pageErrors };
    case 'saved':
      return {
        ...state,
        draft: action.draft,
        savedSnapshot: JSON.stringify(action.draft),
        issues: [],
        pageErrors: {},
      };
  }
}
