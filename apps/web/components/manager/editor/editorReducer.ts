import {
  duplicateNode,
  findNode,
  insertNode,
  moveBy,
  moveNode,
  removeNode,
  updateNodeProps,
  type Location,
} from '@/lib/components/tree';
import { validateTree, type TreeIssue } from '@/lib/components/validateTree';
import type { ComponentNode, Page } from '@/lib/types';

/**
 * The part of the page the editor changes: the stored draft
 * (page.draft, where the tree is called `components`) plus the address.
 */
export type Draft = {
  title: string;
  description: string;
  /** The page's address on its site, e.g. "/about". */
  path: string;
  tree: ComponentNode[];
};

export type PageErrors = {
  title?: string;
  description?: string;
  path?: string;
};

export type EditorState = {
  draft: Draft;
  /** The draft as last saved, serialised, to detect unsaved changes. */
  savedSnapshot: string;
  selectedId: string | null;
  /**
   * Blocks that fail their schema: found on load (a page stored under an
   * older schema) or by the last save; cleared as they get fixed.
   */
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
  | { type: 'setPath'; path: string }
  | { type: 'insertNode'; node: ComponentNode; at: Location }
  | { type: 'moveNode'; id: string; to: Location }
  | { type: 'moveBy'; id: string; step: -1 | 1 }
  | { type: 'duplicate'; id: string }
  | { type: 'removeNode'; id: string }
  | { type: 'updateProps'; id: string; props: Record<string, unknown> }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saveFailed'; issues: TreeIssue[]; pageErrors: PageErrors }
  | { type: 'saved'; draft: Draft }
  /** The server replaced the draft (publish, discard, restore): start afresh. */
  | { type: 'loaded'; draft: Draft };

const HISTORY_LIMIT = 100;

export function initEditor(draft: Draft): EditorState {
  // Check the stored page straight away, so blocks that no longer match
  // their component's schema are outlined before the editor tries to save.
  const checked = validateTree(draft.tree);
  return {
    draft,
    savedSnapshot: JSON.stringify(draft),
    selectedId: null,
    issues: checked.ok ? [] : checked.issues,
    pageErrors: {},
    past: [],
    future: [],
    lastEditKey: null,
  };
}

/** The editor's draft for a page as stored. */
export function draftFromPage(page: Page): Draft {
  return {
    title: page.draft.title,
    description: page.draft.description ?? '',
    path: page.path,
    tree: page.draft.components,
  };
}

/**
 * True when the draft says something different from the published page,
 * i.e. publishing would change what visitors see.
 */
export function differsFromPublished(
  draft: Draft,
  published: Page['published'],
): boolean {
  if (!published) return true;
  return (
    draft.title !== published.title ||
    draft.description !== (published.description ?? '') ||
    JSON.stringify(draft.tree) !== JSON.stringify(published.components)
  );
}

export const isDirty = (state: EditorState) =>
  JSON.stringify(state.draft) !== state.savedSnapshot;

/**
 * Validate the draft after every change, so a field shows its error as soon
 * as it becomes invalid and loses it as soon as it is fixed.
 */
function recheck(state: EditorState): EditorState {
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
    case 'setPath':
      return {
        ...commit(state, { ...draft, path: action.path }, 'path'),
        pageErrors: { ...state.pageErrors, path: undefined },
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
    case 'moveBy':
      return commit(state, {
        ...draft,
        tree: moveBy(draft.tree, action.id, action.step),
      });
    case 'duplicate': {
      const result = duplicateNode(draft.tree, action.id, () =>
        crypto.randomUUID(),
      );
      return {
        ...commit(state, { ...draft, tree: result.tree }),
        selectedId: result.copyId ?? state.selectedId,
      };
    }
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
    case 'loaded':
      return keepSelection({
        ...initEditor(action.draft),
        selectedId: state.selectedId,
      });
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
