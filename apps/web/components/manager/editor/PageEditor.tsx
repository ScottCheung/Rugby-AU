'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Redo2,
  Smartphone,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Badge } from '@scottcheung/ui';
import { Button, SegmentedControl, useToast } from '@scottcheung/ui/client';
import { savePageAction } from '@/app/manager/actions';
import { createNode } from '@/lib/components/createNode';
import { getDefinition, type ComponentType } from '@/lib/components/registry';
import {
  cloneWithNewIds,
  findLocation,
  findNode,
  type Location,
} from '@/lib/components/tree';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import type { ComponentNode, Page, Site } from '@/lib/types';
import { Canvas } from './Canvas';
import { innermostUnderPointer, resolveDropTarget, type DragData } from './dnd';
import {
  EditorContext,
  type DropTarget,
  type EditorContextValue,
} from './editorContext';
import { editorReducer, initEditor, isDirty } from './editorReducer';
import { Layers } from './Layers';
import { Palette } from './Palette';
import { PropertiesPanel } from './PropertiesPanel';

export function PageEditor({ site, page }: { site: Site; page: Page }) {
  const [state, dispatch] = useReducer(
    editorReducer,
    { title: page.title, description: page.description ?? '', tree: page.tree },
    initEditor,
  );
  const { draft } = state;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [saving, startSaving] = useTransition();
  const toast = useToast();
  const dirty = isDirty(state);
  const liveUrl = `/sites/${site.slug}${page.path === '/' ? '' : page.path}`;
  const themeVars = useMemo(
    () => themeToCssVars(resolveTheme(defaultTheme, site.theme)),
    [site.theme],
  );

  // ------------------------------------------------------------ actions

  const insert = useCallback(
    (node: ComponentNode, at: Location) =>
      dispatch({ type: 'insertNode', node, at }),
    [],
  );

  /** Where click-to-add puts a block: into a selected Section, after a selected block, or at the end. */
  const addNew = (type: ComponentType) => {
    const node = createNode(type);
    const selected = state.selectedId
      ? findNode(draft.tree, state.selectedId)
      : undefined;
    if (selected && getDefinition(selected.type)?.acceptsChildren) {
      insert(node, {
        parentId: selected.id,
        index: selected.children?.length ?? 0,
      });
      return;
    }
    const location = selected && findLocation(draft.tree, selected.id);
    insert(
      node,
      location
        ? { ...location, index: location.index + 1 }
        : { index: draft.tree.length },
    );
  };

  const remove = (id: string) => {
    const label =
      getDefinition(findNode(draft.tree, id)?.type ?? '')?.label ?? 'Block';
    dispatch({ type: 'removeNode', id });
    toast({
      title: `${label} deleted`,
      description: 'Press ⌘Z (Ctrl+Z) to undo.',
    });
  };

  const save = () => {
    startSaving(async () => {
      const result = await savePageAction(page.id, draft);
      if (result.ok) {
        const { title, description = '', tree } = result.page;
        dispatch({ type: 'saved', draft: { title, description, tree } });
        toast({
          title: 'Page saved',
          description: 'The live page now shows these changes.',
          tone: 'success',
        });
      } else {
        dispatch({
          type: 'saveFailed',
          issues: result.issues,
          pageErrors: result.pageErrors,
        });
        toast({
          title: result.message,
          description: 'Blocks that need attention are outlined in red.',
          tone: 'danger',
        });
      }
    });
  };

  const context: EditorContextValue = {
    tree: draft.tree,
    siteSlug: site.slug,
    selectedId: state.selectedId,
    hoveredId,
    issues: state.issues,
    dropTarget,
    dragging: dragLabel !== null,
    select: (id) => dispatch({ type: 'select', id }),
    hover: setHoveredId,
    moveUp: (id) => {
      const location = findLocation(draft.tree, id);
      if (location && location.index > 0)
        dispatch({
          type: 'moveNode',
          id,
          to: { ...location, index: location.index - 1 },
        });
    },
    moveDown: (id) => {
      // Drop gaps count the block itself, so "one down" is gap index + 2.
      const location = findLocation(draft.tree, id);
      if (location)
        dispatch({
          type: 'moveNode',
          id,
          to: { ...location, index: location.index + 2 },
        });
    },
    duplicate: (id) => {
      const node = findNode(draft.tree, id);
      const location = findLocation(draft.tree, id);
      if (node && location)
        insert(
          cloneWithNewIds(node, () => crypto.randomUUID()),
          { ...location, index: location.index + 1 },
        );
    },
    remove,
    addNew,
  };

  // ------------------------------------------------------- drag and drop

  // A small distance before dragging starts, so clicks still select.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const dropTargetRef = useRef<DropTarget | null>(null);

  const onDragStart = (event: DragStartEvent) =>
    setDragLabel((event.active.data.current as DragData).label);
  const onDragMove = (event: DragMoveEvent) => {
    const target = resolveDropTarget(event, draft.tree);
    dropTargetRef.current = target;
    setDropTarget((current) =>
      JSON.stringify(current) === JSON.stringify(target) ? current : target,
    );
  };
  const onDragEnd = (event: DragEndEvent) => {
    const target = dropTargetRef.current;
    const drag = event.active.data.current as DragData;
    if (target && event.over) {
      if (drag.kind === 'new') insert(createNode(drag.type), target.at);
      else dispatch({ type: 'moveNode', id: drag.nodeId, to: target.at });
    }
    dropTargetRef.current = null;
    setDropTarget(null);
    setDragLabel(null);
  };

  // ------------------------------------------------------------ keyboard

  const shortcuts = useRef({ save, remove, selectedId: state.selectedId });
  useEffect(() => {
    shortcuts.current = { save, remove, selectedId: state.selectedId };
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
      } else if (!typing && event.key === 'Escape') {
        dispatch({ type: 'select', id: null });
      } else if (
        !typing &&
        (event.key === 'Delete' || event.key === 'Backspace') &&
        shortcuts.current.selectedId
      ) {
        shortcuts.current.remove(shortcuts.current.selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ---------------------------------------------------------------- view

  return (
    <EditorContext.Provider value={context}>
      <DndContext
        // A fixed id keeps the accessibility ids the same on server and client.
        id="page-editor"
        sensors={sensors}
        collisionDetection={innermostUnderPointer}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setDropTarget(null);
          setDragLabel(null);
        }}
      >
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-3 p-3 lg:h-[calc(100dvh-4rem)]">
          {/* Top bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-[var(--ui-surface)] py-1.5 pr-1.5 pl-2 shadow-[var(--ui-shadow-sm)]">
            <Link
              href={`/manager/${site.slug}`}
              className="sc-ui-icon-button"
              aria-label={`Back to ${site.name} pages`}
            >
              <ArrowLeft />
            </Link>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="m-0 truncate text-sm font-bold">
                {draft.title || 'Untitled page'}
              </p>
              <p className="m-0 truncate text-xs text-[var(--ui-muted)]">
                {site.name} · {page.path}
              </p>
            </div>
            <button
              type="button"
              className="sc-ui-icon-button"
              data-variant="ghost"
              aria-label="Undo"
              title="Undo (⌘Z)"
              disabled={state.past.length === 0}
              onClick={() => dispatch({ type: 'undo' })}
            >
              <Undo2 />
            </button>
            <button
              type="button"
              className="sc-ui-icon-button"
              data-variant="ghost"
              aria-label="Redo"
              title="Redo (⇧⌘Z)"
              disabled={state.future.length === 0}
              onClick={() => dispatch({ type: 'redo' })}
            >
              <Redo2 />
            </button>
            <SegmentedControl
              ariaLabel="Preview width"
              value={device}
              onValueChange={(value) =>
                setDevice(value as 'desktop' | 'mobile')
              }
              options={[
                { value: 'desktop', label: <Monitor aria-label="Desktop" /> },
                { value: 'mobile', label: <Smartphone aria-label="Mobile" /> },
              ]}
            />
            {dirty ? (
              <Badge tone="warning">Unsaved changes</Badge>
            ) : (
              <Badge tone="success">All changes saved</Badge>
            )}
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="sc-ui-button"
              data-variant="secondary"
            >
              View live <ExternalLink />
            </a>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </div>

          {/* Palette and layers | canvas | properties */}
          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem]">
            <aside className="order-2 flex min-h-0 flex-col gap-6 overflow-y-auto rounded-[1.5rem] bg-[var(--ui-surface)] p-4 lg:order-1">
              <Palette />
              <Layers />
            </aside>
            <main className="order-1 min-h-0 overflow-y-auto rounded-[1.5rem] bg-[var(--ui-bg-secondary)] p-4 lg:order-2 lg:p-6">
              <Canvas site={site} themeVars={themeVars} device={device} />
            </main>
            <aside className="order-3 min-h-0 overflow-y-auto rounded-[1.5rem] bg-[var(--ui-surface)] p-5">
              <PropertiesPanel
                draft={draft}
                pageErrors={state.pageErrors}
                path={page.path}
                onTitle={(title) => dispatch({ type: 'setTitle', title })}
                onDescription={(description) =>
                  dispatch({ type: 'setDescription', description })
                }
                onProps={(id, props) =>
                  dispatch({ type: 'updateProps', id, props })
                }
              />
            </aside>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragLabel && (
            <div className="inline-flex cursor-grabbing items-center rounded-full bg-[image:var(--ui-primary-gradient)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] shadow-[var(--ui-shadow-md)]">
              {dragLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </EditorContext.Provider>
  );
}
