'use client';

import { DndContext } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Button, Dialog, useToast } from '@scottcheung/ui/client';
import { savePageAction } from '@/app/manager/actions';
import { createNode } from '@/lib/components/createNode';
import { getDefinition, type ComponentType } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import type { Fixture } from '@/lib/fixtures/types';
import type { LibraryImage } from '@/lib/media';
import type { ArticleSummary } from '@/lib/news';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import type { Page, Site } from '@/lib/types';
import { MediaLibraryProvider } from '../ImageField';
import { Canvas } from './Canvas';
import { ComponentPicker } from './ComponentPicker';
import { EditorContext, type EditorContextValue } from './editorContext';
import { editorReducer, initEditor, isDirty } from './editorReducer';
import { EditorTopBar, StatusBadge, type PreviewWidth } from './EditorTopBar';
import { Inspector } from './Inspector';
import { TreePanel, type TreeActions } from './TreePanel';

/**
 * The page editor: top bar, component tree (left), preview (centre) and
 * inspector (right, only while something is selected). All edits change
 * an in-memory draft; nothing is stored until "Save draft".
 */
export function PageEditor({
  site,
  page,
  sites,
  pages,
  images,
  articles,
  colors,
  fixtures,
  now,
}: {
  site: Site;
  page: Page;
  /** For the site switcher. */
  sites: { slug: string; name: string }[];
  /** The site's pages, for the page switcher. */
  pages: { id: string; title: string; path: string }[];
  images: LibraryImage[];
  articles: ArticleSummary[];
  colors: Record<string, string>;
  fixtures: Fixture[];
  now: string;
}) {
  const [state, dispatch] = useReducer(
    editorReducer,
    {
      title: page.title,
      description: page.description ?? '',
      path: page.path,
      tree: page.tree,
    },
    initEditor,
  );
  const { draft } = state;
  const dirty = isDirty(state);
  const router = useRouter();
  const toast = useToast();
  const [saving, startSaving] = useTransition();

  // ------------------------------------------------------------ layout
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [pageSelected, setPageSelected] = useState(false);
  const [wide, setWide] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [width, setWidth] = useState<PreviewWidth>('desktop');
  // The address as last saved: the live link must not follow unsaved edits.
  const [savedPath, setSavedPath] = useState(page.path);
  const liveUrl = `/sites/${site.slug}${savedPath === '/' ? '' : savedPath}`;

  const selectedNode = state.selectedId
    ? findNode(draft.tree, state.selectedId)
    : undefined;
  const inspectorOpen = !fullScreen && (pageSelected || !!selectedNode);

  const select = useCallback((id: string | null) => {
    setPageSelected(false);
    dispatch({ type: 'select', id });
  }, []);

  // --------------------------------------------------- adding components
  /** Where the picker will insert: inside this Section, or the page when undefined. */
  const [pickerParent, setPickerParent] = useState<string | null>(null);
  const PAGE_ROOT = '';
  const pickerOpen = pickerParent !== null;
  const pickerWhere =
    pickerParent === PAGE_ROOT
      ? 'at the end of the page'
      : `at the end of this ${
          getDefinition(findNode(draft.tree, pickerParent ?? '')?.type ?? '')
            ?.label ?? 'Section'
        }`;

  const addComponent = (type: ComponentType) => {
    const parentId = pickerParent || undefined;
    const parent = parentId ? findNode(draft.tree, parentId) : undefined;
    const index = parent ? (parent.children?.length ?? 0) : draft.tree.length;
    dispatch({
      type: 'insertNode',
      node: createNode(type),
      at: { parentId, index },
    });
    setPageSelected(false);
    setPickerParent(null);
  };

  // ------------------------------------------------------------ deleting
  /** A Section with components inside waits here for confirmation. */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const removeNow = (id: string) => {
    const label =
      getDefinition(findNode(draft.tree, id)?.type ?? '')?.label ?? 'Component';
    dispatch({ type: 'removeNode', id });
    toast({
      title: `${label} deleted`,
      description: 'Press ⌘Z (Ctrl+Z) to undo.',
    });
  };
  const requestRemove = (id: string) => {
    const node = findNode(draft.tree, id);
    if (node?.children && node.children.length > 0) setConfirmDelete(id);
    else removeNow(id);
  };
  const toDelete = confirmDelete
    ? findNode(draft.tree, confirmDelete)
    : undefined;

  const treeActions: TreeActions = {
    selectPage: () => {
      dispatch({ type: 'select', id: null });
      setPageSelected(true);
    },
    select,
    add: (parentId) => setPickerParent(parentId ?? PAGE_ROOT),
    move: (id, step) => dispatch({ type: 'moveBy', id, step }),
    duplicate: (id) => dispatch({ type: 'duplicate', id }),
    remove: requestRemove,
  };

  // -------------------------------------------------------------- saving
  const save = () => {
    startSaving(async () => {
      const result = await savePageAction(page.id, draft);
      if (result.ok) {
        const { title, description = '', path, tree } = result.page;
        dispatch({ type: 'saved', draft: { title, description, path, tree } });
        setSavedPath(path);
        toast({ title: 'Draft saved', tone: 'success' });
      } else {
        dispatch({
          type: 'saveFailed',
          issues: result.issues,
          pageErrors: result.pageErrors,
        });
        if (Object.keys(result.pageErrors).length > 0) treeActions.selectPage();
        toast({
          title: result.message,
          description: 'Components that need attention have a red dot.',
          tone: 'danger',
        });
      }
    });
  };

  // ---------------------------------------------- leaving with unsaved work
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const navigate = (href: string) => {
    if (dirty) setLeaveTo(href);
    else router.push(href);
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ------------------------------------------------------------ keyboard
  const shortcuts = useRef({
    save,
    requestRemove,
    selectedId: state.selectedId,
  });
  useEffect(() => {
    shortcuts.current = { save, requestRemove, selectedId: state.selectedId };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest(
        'input, textarea, select, [contenteditable]',
      );
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        shortcuts.current.save();
      } else if (mod && event.key.toLowerCase() === 'z' && !typing) {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      } else if (
        !typing &&
        (event.key === 'Delete' || event.key === 'Backspace') &&
        shortcuts.current.selectedId
      ) {
        shortcuts.current.requestRemove(shortcuts.current.selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ------------------------------------------- preview (replaced in step 2)
  const themeVars = useMemo(
    () => themeToCssVars(resolveTheme(defaultTheme, site.theme)),
    [site.theme],
  );
  const canvasContext: EditorContextValue = {
    tree: draft.tree,
    siteSlug: site.slug,
    siteData: { articles, pagePath: savedPath, colors, fixtures, now },
    selectedId: state.selectedId,
    hoveredId: null,
    issues: state.issues,
    dropTarget: null,
    dragging: false,
    select: (id) => select(id),
    hover: () => {},
    moveUp: (id) => dispatch({ type: 'moveBy', id, step: -1 }),
    moveDown: (id) => dispatch({ type: 'moveBy', id, step: 1 }),
    duplicate: (id) => dispatch({ type: 'duplicate', id }),
    remove: requestRemove,
    addNew: () => {},
  };
  const menu = pages
    .filter((item) => item.path.split('/').length === 2)
    .map((item) => ({
      id: item.id,
      label: item.path === '/' ? 'Home' : item.title,
      current: item.id === page.id,
    }));

  // ---------------------------------------------------------------- view
  return (
    <div className="flex h-dvh flex-col">
      <EditorTopBar
        sites={sites}
        siteSlug={site.slug}
        pages={pages}
        pageId={page.id}
        onNavigate={navigate}
        width={width}
        onWidthChange={setWidth}
        fullScreen={fullScreen}
        onFullScreenChange={setFullScreen}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        liveUrl={liveUrl}
        status={<StatusBadge unsaved={dirty} unpublished={false} />}
        actions={
          <Button onClick={save} loading={saving}>
            Save draft
          </Button>
        }
      />

      <div className="relative flex min-h-0 flex-1">
        {!fullScreen && (
          <TreePanel
            title={draft.title}
            tree={draft.tree}
            selectedId={state.selectedId}
            pageSelected={pageSelected}
            issues={state.issues}
            collapsed={treeCollapsed}
            onCollapsedChange={setTreeCollapsed}
            actions={treeActions}
          />
        )}

        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--ui-bg-secondary)] p-4">
          <EditorContext.Provider value={canvasContext}>
            <DndContext id="page-editor">
              <Canvas
                site={site}
                themeVars={themeVars}
                device={width}
                menu={menu}
              />
            </DndContext>
          </EditorContext.Provider>
        </main>

        {inspectorOpen && (
          <MediaLibraryProvider images={images}>
            <Inspector
              node={selectedNode}
              draft={draft}
              pageId={page.id}
              savedPath={savedPath}
              pageErrors={state.pageErrors}
              issues={state.issues}
              wide={wide}
              onWideChange={setWide}
              onClose={() => select(null)}
              onProps={(id, props) =>
                dispatch({ type: 'updateProps', id, props })
              }
              onTitle={(title) => dispatch({ type: 'setTitle', title })}
              onDescription={(description) =>
                dispatch({ type: 'setDescription', description })
              }
              onPath={(path) => dispatch({ type: 'setPath', path })}
            />
          </MediaLibraryProvider>
        )}
      </div>

      <ComponentPicker
        open={pickerOpen}
        where={pickerWhere}
        onPick={addComponent}
        onClose={() => setPickerParent(null)}
      />

      <Dialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`Delete this ${getDefinition(toDelete?.type ?? '')?.label ?? 'Section'}?`}
        description={`It has ${toDelete?.children?.length ?? 0} component(s) inside. They will be deleted too. You can undo with ⌘Z until you leave the page.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDelete) removeNow(confirmDelete);
              setConfirmDelete(null);
            }}
          >
            Delete all
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={leaveTo !== null}
        onOpenChange={(open) => !open && setLeaveTo(null)}
        title="Leave without saving?"
        description="This page has changes that are not saved. If you leave now they are lost."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setLeaveTo(null)}>
            Stay on this page
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (leaveTo) router.push(leaveTo);
              setLeaveTo(null);
            }}
          >
            Leave and lose changes
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
