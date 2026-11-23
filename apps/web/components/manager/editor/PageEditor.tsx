'use client';

import { Eraser, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Button, Dialog, IconButton, useToast } from '@scottcheung/ui/client';
import {
  discardDraftAction,
  getVersionAction,
  publishPageAction,
  restoreVersionAction,
  savePageAction,
} from '@/app/manager/actions';
import { createNode } from '@/lib/components/createNode';
import { getDefinition } from '@/lib/components/registry';
import type { ItemRef } from '@/lib/components/items';
import { nodeName } from '@/lib/components/outline';
import { ancestorIds, findLocation, findNode } from '@/lib/components/tree';
import type { LibraryImage } from '@/lib/media';
import {
  collectionIds,
  collections,
  summarizeEntry,
  type CollectionId,
  type Entry,
  type EntrySummary,
} from '@/lib/collections';
import { createEntryInPlaceAction } from '@/app/manager/entryActions';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { Starter } from '@/lib/components/starters';
import type { ComponentNode, Page, Site } from '@/lib/types';
import { MediaLibraryProvider } from '../ImageField';
import {
  differsFromPublished,
  draftFromPage,
  editorReducer,
  initEditor,
  isDirty,
} from './editorReducer';
import { devices } from './devices';
import {
  EditorToolbar,
  StatusBadge,
  useHideOnScroll,
  type PreviewWidth,
} from './EditorToolbar';
import {
  Inspector,
  type Crumb,
  type InspectorMode,
  type InspectorTab,
} from './Inspector';
import { AddBlockDialog } from './AddBlockDialog';
import { itemName } from './blockEdit';
import { PreviewFrame } from './PreviewFrame';
import { SiteSettings } from './SiteSettings';
import {
  CollectionPanel,
  EntryPanel,
  entryDirty,
  entryKey,
  type EntryDraft,
} from './EntryPanel';
import { SiteNav } from './SiteNav';
import { TreePanel, type TreeActions } from './TreePanel';
import { VersionsDrawer } from './VersionsDrawer';

/** True when a container (a Section) has something in it. */
const holdsContent = (node: ComponentNode | undefined) =>
  !!node?.children?.length;

/** What the right panel shows when no component is selected. */
type Scope = Extract<
  InspectorMode,
  { level: 'site' | 'page' | 'collection' | 'entry' }
>;

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
  entries,
  data,
  initialPanel,
}: {
  site: Site;
  page: Page;
  /** For the site switcher. */
  sites: { slug: string; name: string; logoUrl?: string }[];
  /** The site's pages, for the page switcher. */
  pages: { id: string; title: string; path: string }[];
  images: LibraryImage[];
  /** The site's news and players, to pick from, hide or open. */
  entries: EntrySummary[];
  /**
   * What blocks fed by the site's data show (published news and players,
   * every match), for the Layers tree and the item panels. Refreshed from
   * the server after an article or a player is saved.
   */
  data: SiteData;
  /** Open with the site's settings, news or players (?panel=...). */
  initialPanel?: 'site' | CollectionId;
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
  /**
   * What the inspector shows when no component is selected: the site's
   * settings or the page's. Something is always selected, so the panel
   * never comes and goes and the preview keeps its size.
   */
  const [scope, setScope] = useState<Scope>(
    initialPanel === 'site'
      ? { level: 'site' }
      : initialPanel
        ? { level: 'collection', collection: initialPanel }
        : { level: 'page' },
  );
  const pageSelected = scope.level === 'page';

  // ---------------------------------------------- the site's news, players
  /** The site's entries as listed; follows saves made in the panel. */
  const [entryList, setEntryList] = useState(entries);
  /** Entries opened in the panel, with any unsaved edits. */
  const [entryDrafts, setEntryDrafts] = useState<Record<string, EntryDraft>>(
    {},
  );
  const entriesDirty = Object.values(entryDrafts).some(entryDirty);
  /** Goes up after an entry is saved: the preview reloads its content. */
  const [contentVersion, setContentVersion] = useState(0);
  const [creating, startCreating] = useTransition();
  /** The site as saved, and as being edited (the preview follows that). */
  const [savedSite, setSavedSite] = useState(site);
  const [siteDraft, setSiteDraft] = useState(site);
  const [wide, setWide] = useState(false);
  /** The inspector's tab: kept as the selection changes. */
  const [tab, setTab] = useState<InspectorTab>('content');
  const [fullScreen, setFullScreen] = useState(false);
  // The floating toolbar tucks away while the preview scrolls down.
  const toolbar = useHideOnScroll();
  // How the preview is laid out, for the caption under the toolbar.
  const [size, setSize] = useState({ pageWidth: 0, scale: 1 });
  const [width, setWidth] = useState<PreviewWidth>('desktop');
  // The address as last saved: the live link must not follow unsaved edits.
  const [savedPath, setSavedPath] = useState(page.path);
  const liveUrl = published
    ? `/sites/${site.slug}${savedPath === '/' ? '' : savedPath}`
    : undefined;

  const selectedNode = state.selectedId
    ? findNode(draft.tree, state.selectedId)
    : undefined;
  const mode: InspectorMode = selectedNode
    ? state.selectedItem
      ? { level: 'item', node: selectedNode, item: state.selectedItem }
      : { level: 'node', node: selectedNode }
    : scope;
  const inspectorOpen = !fullScreen;
  // Leaving the site settings without saving: the preview goes back to the
  // saved site (adjusting state during render rather than in an effect).
  const onSiteLevel = mode.level === 'site';
  const [wasOnSiteLevel, setWasOnSiteLevel] = useState(onSiteLevel);
  if (onSiteLevel !== wasOnSiteLevel) {
    setWasOnSiteLevel(onSiteLevel);
    if (!onSiteLevel) setSiteDraft(savedSite);
  }

  const select = useCallback((id: string | null, item?: ItemRef | null) => {
    setScope({ level: 'page' });
    dispatch({ type: 'select', id, item });
  }, []);
  const selectScope = useCallback((next: Scope | 'page' | 'site') => {
    dispatch({ type: 'select', id: null });
    setScope(typeof next === 'string' ? { level: next } : next);
  }, []);

  const putEntry = (entry: Entry, data = entry.data) =>
    setEntryDrafts((current) => ({
      ...current,
      [entryKey(entry.collection, entry.slug)]: { saved: entry, data },
    }));
  /** `keepEdits`: only the status changed; unsaved edits stay. */
  const entrySaved = (entry: Entry, keepEdits: boolean) => {
    const draft = entryDrafts[entryKey(entry.collection, entry.slug)];
    putEntry(entry, keepEdits && draft ? draft.data : entry.data);
    const summary = summarizeEntry(entry);
    setEntryList((list) =>
      list.some(
        (one) => one.collection === entry.collection && one.slug === entry.slug,
      )
        ? list.map((one) =>
            one.collection === entry.collection && one.slug === entry.slug
              ? summary
              : one,
          )
        : [summary, ...list],
    );
    setContentVersion((version) => version + 1);
    // The Layers tree and the panels read the site's data: fetch it again.
    router.refresh();
  };
  const entryDeleted = (collection: CollectionId, slug: string) => {
    setEntryList((list) =>
      list.filter((one) => one.collection !== collection || one.slug !== slug),
    );
    setEntryDrafts((current) => {
      const next = { ...current };
      delete next[entryKey(collection, slug)];
      return next;
    });
    setContentVersion((version) => version + 1);
    // The Layers tree and the panels read the site's data: fetch it again.
    router.refresh();
    if (state.selectedId) select(state.selectedId);
    else selectScope({ level: 'collection', collection });
  };
  const createEntry = (collection: CollectionId) =>
    startCreating(async () => {
      const created = await createEntryInPlaceAction(site.slug, collection);
      if ('error' in created) {
        toast({ title: created.error, tone: 'danger' });
        return;
      }
      putEntry(created);
      setEntryList((list) => [summarizeEntry(created), ...list]);
      selectScope({ level: 'entry', collection, slug: created.slug });
    });
  const entryPanel = (collection: CollectionId, slug: string) => {
    const key = entryKey(collection, slug);
    return (
      <EntryPanel
        key={key}
        siteSlug={site.slug}
        collection={collection}
        slug={slug}
        draft={entryDrafts[key]}
        onLoaded={(entry) => putEntry(entry)}
        onChange={(data) =>
          setEntryDrafts((current) =>
            current[key]
              ? { ...current, [key]: { ...current[key], data } }
              : current,
          )
        }
        onSaved={entrySaved}
        onDeleted={() => entryDeleted(collection, slug)}
      />
    );
  };

  /** Where you are, outermost first; each step leads back up. */
  const crumbs: Crumb[] = [
    {
      key: 'site',
      label: siteDraft.name,
      onSelect: () => selectScope('site'),
    },
  ];
  if (mode.level === 'collection' || mode.level === 'entry') {
    const { collection } = mode;
    crumbs.push({
      key: 'collection',
      label: collections[collection].label,
      onSelect: () => selectScope({ level: 'collection', collection }),
    });
    if (mode.level === 'entry')
      crumbs.push({
        key: 'entry',
        label:
          entryList.find(
            (one) => one.collection === collection && one.slug === mode.slug,
          )?.title ?? collections[collection].itemLabel,
      });
  } else if (mode.level !== 'site') {
    crumbs.push({
      key: 'page',
      label: draft.title || 'Untitled page',
      onSelect: () => selectScope('page'),
    });
    if (mode.level === 'node' || mode.level === 'item') {
      for (const id of [
        ...ancestorIds(draft.tree, mode.node.id),
        mode.node.id,
      ]) {
        const node = findNode(draft.tree, id);
        if (node)
          crumbs.push({
            key: id,
            label: nodeName(node).name,
            onSelect: () => select(id),
          });
      }
      if (mode.level === 'item')
        crumbs.push({
          key: 'item',
          label: itemName(mode.node, mode.item, data),
        });
    }
  }

  /** Esc: item -> block -> Section -> page -> site. */
  const goUp = () => {
    if (mode.level === 'item') select(mode.node.id);
    else if (mode.level === 'node') {
      const parent = findLocation(draft.tree, mode.node.id)?.parentId;
      if (parent) select(parent);
      else selectScope('page');
    } else if (mode.level === 'entry')
      selectScope({ level: 'collection', collection: mode.collection });
    else if (mode.level === 'page' || mode.level === 'collection')
      selectScope('site');
  };

  // ------------------------------------------------------------ adding
  /**
   * Where "Add a block" puts what is picked: in a Section (at `index`, or
   * at its end), or on the page, where it gets a Section of its own.
   */
  const [adding, setAdding] = useState<
    { sectionId: string; index?: number } | { page: true } | null
  >(null);
  const addSection = () => setAdding({ page: true });
  const addInto = (sectionId: string, index?: number) =>
    setAdding({ sectionId, index });
  const place = (starter: Starter) => {
    const node = starter.create();
    if (!adding) return;
    if ('page' in adding) {
      const section = { ...createNode('section'), children: [node] };
      dispatch({
        type: 'insertNode',
        node: section,
        at: { index: draft.tree.length },
        select: node.id,
      });
    } else {
      const parent = findNode(draft.tree, adding.sectionId);
      dispatch({
        type: 'insertNode',
        node,
        at: {
          parentId: adding.sectionId,
          index: adding.index ?? parent?.children?.length ?? 0,
        },
      });
    }
    setScope({ level: 'page' });
    // The new block's items are what is filled in first.
    setTab('content');
    setAdding(null);
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
    if (holdsContent(node)) setConfirmDelete(id);
    else removeNow(id);
  };
  const toDelete = confirmDelete
    ? findNode(draft.tree, confirmDelete)
    : undefined;

  const treeActions: TreeActions = {
    selectPage: () => selectScope('page'),
    select,
    add: addSection,
    move: (id, step) => dispatch({ type: 'moveBy', id, step }),
    moveTo: (id, to) => dispatch({ type: 'moveNode', id, to }),
    duplicate: (id) => dispatch({ type: 'duplicate', id }),
    remove: requestRemove,
    addInto: (sectionId) => addInto(sectionId),
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
  const unsaved = dirty || entriesDirty;
  const navigate = (href: string) => {
    if (unsaved) setLeaveTo(href);
    else router.push(href);
  };
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // ------------------------------------------------------------ keyboard
  const shortcuts = useRef({
    save,
    requestRemove,
    goUp,
    selectedId: state.selectedId,
    selectedItem: state.selectedItem,
  });
  useEffect(() => {
    shortcuts.current = {
      save,
      requestRemove,
      goUp,
      selectedId: state.selectedId,
      selectedItem: state.selectedItem,
    };
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
        shortcuts.current.selectedId &&
        // An item is deleted from its own panel, not the whole component.
        !shortcuts.current.selectedItem
      ) {
        shortcuts.current.requestRemove(shortcuts.current.selectedId);
      } else if (
        event.key === 'Escape' &&
        !typing &&
        // Dialogs close themselves with Esc.
        !document.querySelector('[role="dialog"]')
      ) {
        shortcuts.current.goUp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ---------------------------------------------------------------- view
  return (
    // overflow-hidden: the toolbar slides out below the canvas when it hides,
    // which must not make the page itself scrollable.
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1">
        {!fullScreen && (
          <TreePanel
            title={draft.title}
            tree={draft.tree}
            selectedId={state.selectedId}
            selectedItem={state.selectedItem}
            data={data}
            pageSelected={pageSelected && !selectedNode}
            top={
              <SiteNav
                current={
                  selectedNode
                    ? null
                    : scope.level === 'site'
                      ? 'site'
                      : scope.level === 'collection' || scope.level === 'entry'
                        ? scope.collection
                        : null
                }
                counts={
                  Object.fromEntries(
                    collectionIds.map((id) => [
                      id,
                      entryList.filter((one) => one.collection === id).length,
                    ]),
                  ) as Record<CollectionId, number>
                }
                onSelect={(target) =>
                  selectScope(
                    target === 'site'
                      ? 'site'
                      : { level: 'collection', collection: target },
                  )
                }
              />
            }
            issues={state.issues}
            collapsed={treeCollapsed}
            onCollapsedChange={setTreeCollapsed}
            actions={treeActions}
          />
        )}

        <main
          // A desktop preview fills the whole middle; only a tablet or a
          // phone sits in a padded, tinted frame.
          className={`relative flex min-w-0 flex-1 flex-col gap-3 bg-[var(--ui-bg-secondary)] ${width === 'desktop' ? '' : 'p-4'}`}
        >
          {viewing && (
            <div
              className={`flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--ui-surface)] px-4 py-2 text-sm shadow-[var(--ui-shadow-sm)] ${width === 'desktop' ? 'mx-4 mt-4' : ''}`}
            >
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
              src={`/preview/${site.slug}${savedPath === '/' ? '' : savedPath}${contentVersion ? `?content=${contentVersion}` : ''}`}
              title={viewing?.title ?? draft.title}
              components={viewing?.components ?? draft.tree}
              selectedId={state.selectedId}
              selectedItem={state.selectedItem}
              site={siteDraft}
              readOnly={viewing !== null}
              width={width}
              onSelect={select}
              onSelectSite={() => selectScope('site')}
              onAddSlot={addInto}
              onScroll={toolbar.onScroll}
              onMeasure={setSize}
            />
          </div>
          {/* While the toolbar is away, pointing at the canvas's bottom edge
              brings it back without scrolling. */}
          {toolbar.hidden && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-6"
              onMouseEnter={toolbar.show}
            />
          )}
          <EditorToolbar
            hidden={toolbar.hidden}
            caption={
              <>
                <strong>{site.name}</strong>
                <span>
                  {draft.title} ({savedPath})
                </span>
                <span>
                  {devices[width].label} · {size.pageWidth}px ·{' '}
                  {Math.round(size.scale * 100)}%
                </span>
              </>
            }
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
                <IconButton
                  variant="ghost"
                  label="Discard changes"
                  disabled={busy || !published || (!dirty && !unpublished)}
                  onClick={() => setConfirmDiscard(true)}
                >
                  <Eraser />
                </IconButton>
                <IconButton
                  variant="ghost"
                  label="History"
                  disabled={busy}
                  onClick={() => setHistoryOpen(true)}
                >
                  <History />
                </IconButton>
                <Button
                  variant="secondary"
                  disabled={busy || !dirty}
                  onClick={save}
                >
                  Save
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
        </main>

        {inspectorOpen && (
          <MediaLibraryProvider images={images}>
            <Inspector
              mode={mode}
              crumbs={crumbs}
              sitePanel={(part) => (
                <SiteSettings
                  part={part}
                  site={savedSite}
                  pages={pages}
                  onPreview={setSiteDraft}
                  onSaved={(saved) => {
                    setSavedSite(saved);
                    setSiteDraft(saved);
                  }}
                />
              )}
              collectionPanel={(collection) => (
                <CollectionPanel
                  collection={collection}
                  entries={entryList}
                  dirtyKeys={
                    new Set(
                      Object.entries(entryDrafts)
                        .filter(([, one]) => entryDirty(one))
                        .map(([key]) => key),
                    )
                  }
                  busy={creating}
                  onOpen={(slug) =>
                    selectScope({ level: 'entry', collection, slug })
                  }
                  onCreate={() => createEntry(collection)}
                />
              )}
              entryPanel={entryPanel}
              data={data}
              draft={draft}
              pageId={page.id}
              savedPath={savedPath}
              isTemplate={!!page.template}
              pageErrors={state.pageErrors}
              issues={state.issues}
              wide={wide}
              onWideChange={setWide}
              tab={tab}
              onTabChange={setTab}
              onSelect={(id) => select(id)}
              onChangeType={(id, nodeType, props) =>
                dispatch({ type: 'changeType', id, nodeType, props })
              }
              onAddInto={(sectionId) => addInto(sectionId)}
              onProps={(id, props, separate) =>
                dispatch({ type: 'updateProps', id, props, separate })
              }
              onSelectItem={(id, item) => select(id, item)}
              onTitle={(title) => dispatch({ type: 'setTitle', title })}
              onDescription={(description) =>
                dispatch({ type: 'setDescription', description })
              }
              onPath={(path) => dispatch({ type: 'setPath', path })}
              onNav={(nav) => dispatch({ type: 'setNav', nav })}
            />
          </MediaLibraryProvider>
        )}
      </div>

      <Dialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this Section?"
        description={`Its ${toDelete?.children?.length ?? 0} block(s) and everything in them will be deleted too. You can undo with ⌘Z until you leave the page.`}
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

      <AddBlockDialog
        open={adding !== null}
        onOpenChange={(open) => !open && setAdding(null)}
        title={adding && 'page' in adding ? 'Add a section' : 'Add a block'}
        allowSection={!!adding && !('page' in adding)}
        onPick={place}
      />

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
