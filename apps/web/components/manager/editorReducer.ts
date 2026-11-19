import {
  addNode,
  findNode,
  removeNode,
  updateNodeProps,
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
};

export type EditorAction =
  | { type: 'setTitle'; title: string }
  | { type: 'setDescription'; description: string }
  | { type: 'addNode'; node: ComponentNode; parentId?: string }
  | { type: 'removeNode'; id: string }
  | { type: 'updateProps'; id: string; props: Record<string, unknown> }
  | { type: 'select'; id: string | null }
  | { type: 'saveFailed'; issues: TreeIssue[]; pageErrors: PageErrors }
  | { type: 'saved'; draft: Draft };

export function initEditor(draft: Draft): EditorState {
  return {
    draft,
    savedSnapshot: JSON.stringify(draft),
    selectedId: null,
    issues: [],
    pageErrors: {},
  };
}

export const isDirty = (state: EditorState) =>
  JSON.stringify(state.draft) !== state.savedSnapshot;

/** After a failed save, re-check on every edit so fixed fields lose their error. */
function withTree(state: EditorState, tree: ComponentNode[]): EditorState {
  const draft = { ...state.draft, tree };
  if (state.issues.length === 0) return { ...state, draft };
  const result = validateTree(tree);
  return { ...state, draft, issues: result.ok ? [] : result.issues };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case 'setTitle':
      return {
        ...state,
        draft: { ...state.draft, title: action.title },
        pageErrors: { ...state.pageErrors, title: undefined },
      };
    case 'setDescription':
      return {
        ...state,
        draft: { ...state.draft, description: action.description },
        pageErrors: { ...state.pageErrors, description: undefined },
      };
    case 'addNode':
      return {
        ...withTree(
          state,
          addNode(state.draft.tree, action.node, action.parentId),
        ),
        selectedId: action.node.id,
      };
    case 'removeNode': {
      const next = withTree(state, removeNode(state.draft.tree, action.id));
      // Deselect if the selected node was removed (directly or inside a Section).
      const stillThere =
        state.selectedId && findNode(next.draft.tree, state.selectedId);
      return { ...next, selectedId: stillThere ? state.selectedId : null };
    }
    case 'updateProps':
      return withTree(
        state,
        updateNodeProps(state.draft.tree, action.id, action.props),
      );
    case 'select':
      return { ...state, selectedId: action.id };
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
