'use client';

import { History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Button, Dialog, useToast } from '@scottcheung/ui/client';
import {
  discardDraftAction,
  getVersionAction,
  publishPageAction,
  restoreVersionAction,
  savePageAction,
} from '@/app/manager/actions';
import { createNode } from '@/lib/components/createNode';
import { getDefinition, type ComponentType } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import type { LibraryImage } from '@/lib/media';
import type { ComponentNode, Page, Site } from '@/lib/types';
import { MediaLibraryProvider } from '../ImageField';
import { ComponentPicker } from './ComponentPicker';
import {
  differsFromPublished,
  draftFromPage,
  editorReducer,
  initEditor,
  isDirty,
} from './editorReducer';
import { EditorTopBar, StatusBadge, type PreviewWidth } from './EditorTopBar';
import { Inspector } from './Inspector';
import { PreviewFrame } from './PreviewFrame';
import { TreePanel, type TreeActions } from './TreePanel';
import { VersionsDrawer } from './VersionsDrawer';

/**
 * The page editor: top bar, component tree (left), preview (centre) and
 * inspector (right, only while something is selected). All edits change
 * an in-memory draft: "Save draft" stores it, "Publish" makes the stored
 * draft the live page.
 */
export function PageEditor({
  site,
  page,
  sites,
  pages,
  images,
}: {
  site: Site;
  page: Page;
  /** For the site switcher. */
  sites: { slug: string; name: string }[];
  /** The site's pages, for the page switcher. */
  pages: { id: string; title: string; path: string }[];
  images: LibraryImage[];
}) {
  const [state, dispatch] = useReducer(
    editorReducer,
    draftFromPage(page),
    initEditor,
  );
  const { draft } = state;
  const dirty = isDirty(state);
  const router = useRouter();
  const toast = useToast();
  /** One server call at a time: save, publish, discard or restore. */
  const [busy, startBusy] = useTransition();
  /** What visitors see now; null until the first publish. */
  const [published, setPublished] = useState(page.published);
  const unpublished = differsFromPublished(draft, published);

  // ------------------------------------------------------------ layout
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [pageSelected, setPageSelected] = useState(false);
  const [wide, setWide] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [width, setWidth] = useState<PreviewWidth>('desktop');
  // The address as last saved: the live link must not follow unsaved edits.
  const [savedPath, setSavedPath] = useState(page.path);
  const liveUrl = published
    ? `/sites/${site.slug}${savedPath === '/' ? '' : savedPath}`
    : undefined;

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
  /** Store the draft. Resolves to false (and shows why) if it was refused. */
  const saveDraft = async (): Promise<boolean> => {
    const result = await savePageAction(page.id, draft);
    if (result.ok) {
      dispatch({ type: 'saved', draft: draftFromPage(result.page) });
      setSavedPath(result.page.path);
      return true;
    }
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
    return false;
  };

  const save = () =>
    startBusy(async () => {
      if (await saveDraft()) toast({ title: 'Draft saved', tone: 'success' });
    });

  /** Publish: save first if needed, then make the saved draft live. */
  const publish = () =>
    startBusy(async () => {
      if (dirty && !(await saveDraft())) return;
      const result = await publishPageAction(page.id);
      if (!result.ok) {
        dispatch({ type: 'saveFailed', issues: result.issues, pageErrors: {} });
        toast({ title: result.message, tone: 'danger' });
        return;
      }
      dispatch({ type: 'loaded', draft: draftFromPage(result.page) });
      setPublished(result.page.published);
      toast({
        title: `Published version ${result.page.published?.version}`,
        description: 'Visitors now see this page.',
        tone: 'success',
      });
    });

  // ---------------------------------------------------- discard, history
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discard = () =>
    startBusy(async () => {
      setConfirmDiscard(false);
      const result = await discardDraftAction(page.id);
      if (!result) return;
      dispatch({ type: 'loaded', draft: draftFromPage(result) });
      toast({
        title: 'Changes discarded',
        description: 'Back to the published page.',
      });
    });

  const [historyOpen, setHistoryOpen] = useState(false);
  /** A past version shown in the preview instead of the draft (read-only). */
  const [viewing, setViewing] = useState<{
    version: number;
    title: string;
    components: ComponentNode[];
  } | null>(null);

  const viewVersion = (version: number) =>
    startBusy(async () => {
      const found = await getVersionAction(page.id, version);
      if (found) setViewing({ version, ...found });
      setHistoryOpen(false);
    });

  const restore = (version: number) =>
    startBusy(async () => {
      const result = await restoreVersionAction(page.id, version);
      if (!result) return;
      dispatch({ type: 'loaded', draft: draftFromPage(result) });
      setViewing(null);
      setHistoryOpen(false);
      toast({
        title: `Version ${version} restored to the draft`,
        description: 'Publish to make it live.',
        tone: 'success',
      });
    });

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
        status={<StatusBadge unsaved={dirty} unpublished={unpublished} />}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={busy || !published || (!dirty && !unpublished)}
              onClick={() => setConfirmDiscard(true)}
            >
              Discard changes
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setHistoryOpen(true)}
            >
              <History /> History
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !dirty}
              onClick={save}
            >
              Save draft
            </Button>
            <Button
              disabled={busy || (!dirty && !unpublished)}
              onClick={publish}
            >
              Publish
            </Button>
          </>
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

        <main className="flex min-w-0 flex-1 flex-col gap-3 bg-[var(--ui-bg-secondary)] p-4">
          {viewing && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--ui-surface)] px-4 py-2 text-sm shadow-[var(--ui-shadow-sm)]">
              <span className="flex-1">
                Viewing <strong>version {viewing.version}</strong> (read-only).
                Your draft is unchanged.
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || dirty}
                title={dirty ? 'Save or discard your changes first' : undefined}
                onClick={() => restore(viewing.version)}
              >
                Restore to draft
              </Button>
              <Button size="sm" onClick={() => setViewing(null)}>
                Back to the draft
              </Button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <PreviewFrame
              src={`/preview/${site.slug}${savedPath === '/' ? '' : savedPath}`}
              title={viewing?.title ?? draft.title}
              components={viewing?.components ?? draft.tree}
              selectedId={state.selectedId}
              readOnly={viewing !== null}
              width={width}
              onSelect={select}
            />
          </div>
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

      <VersionsDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        pageId={page.id}
        currentVersion={published?.version}
        viewingVersion={viewing?.version}
        canRestore={!dirty && !busy}
        onView={viewVersion}
        onRestore={restore}
      />

      <Dialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description={`The draft goes back to the published version ${published?.version ?? ''}. Every change since then, saved or not, is lost.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={discard}>
            Discard changes
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
