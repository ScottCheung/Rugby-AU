'use client';

import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  EyeOff,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { IconButton } from '@scottcheung/ui/client';
import {
  containerIds,
  dropLocation,
  nodeName,
  nodeSketch,
  type DropPosition,
} from '@/lib/components/outline';
import { getDefinition } from '@/lib/components/registry';
import { allNodes, ancestorIds, type Location } from '@/lib/components/tree';
import type { TreeIssue } from '@/lib/components/validateTree';
import { sameItem, type ItemRef } from '@/lib/components/items';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode } from '@/lib/types';
import { drawnItems } from './blockEdit';
import { Sketch } from '../Sketch';
import { ComponentIcon } from './componentIcons';
import { useScrollFade } from '../useScrollFade';

/** What the tree panel can ask the editor to do. */
export type TreeActions = {
  selectPage: () => void;
  select: (id: string, item?: ItemRef | null) => void;
  /** Add an empty Section at the end of the page. */
  add: () => void;
  move: (id: string, step: -1 | 1) => void;
  /** Drag and drop: put the block at this location. */
  moveTo: (id: string, to: Location) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  /** Ask for a new block at the end of this Section. */
  addInto: (sectionId: string) => void;
};

/** At most this many item rows under a block (a squad has 40+ players). */
const MAX_ROWS = 60;

/** Indent per level and the row's own left padding, in px. */
const INDENT = 16;
const PAD = 6;
/** Hovering a closed Section this long while dragging opens it. */
const OPEN_DELAY = 500;

type Drop = { targetId: string; position: DropPosition } | { root: true };

/**
 * Column widths for a Section layout's sketch name. The full sketches are
 * drawn for the size of a picker tile; at icon size they blur into a blob,
 * so the outline draws the columns alone.
 */
const columnsBySketch: Record<string, number[]> = {
  'one-column': [1],
  'two-column': [1, 1],
  'two-column-wide': [2, 1],
  'two-column-wide-right': [1, 2],
  'three-column': [1, 1, 1],
};

/** A Section's layout at icon size: its columns inside a frame. */
function ColumnsGlyph({ columns }: { columns: number[] }) {
  const inner = 14;
  const gap = 1.5;
  const total = columns.reduce((sum, column) => sum + column, 0);
  const unit = (inner - gap * (columns.length - 1)) / total;
  // Each column starts where the ones before it (and their gaps) end.
  const starts = columns.map(
    (_, index) =>
      3 +
      columns
        .slice(0, index)
        .reduce((sum, column) => sum + column * unit + gap, 0),
  );
  return (
    <svg viewBox="0 0 20 14" width={20} height={14} aria-hidden>
      <rect
        x={0.75}
        y={0.75}
        width={18.5}
        height={12.5}
        rx={2.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      />
      {columns.map((column, index) => (
        <rect
          key={index}
          x={starts[index]}
          y={3}
          width={column * unit}
          height={8}
          rx={1}
          fill="currentColor"
          opacity={0.55}
        />
      ))}
    </svg>
  );
}

/**
 * The left panel: the page's blocks as an outline, like a file tree.
 * Only the top level shows at first; Sections open with their chevron (or
 * on their own when something inside them is selected). Drag a row to move
 * it before, after or into another. Alt+↑/↓ moves the focused row, ←/→
 * close and open it.
 */
export function TreePanel({
  title,
  tree,
  selectedId,
  selectedItem,
  data,
  pageSelected,
  issues,
  collapsed,
  onCollapsedChange,
  actions,
  top,
}: {
  title: string;
  tree: ComponentNode[];
  selectedId: string | null;
  /** An item inside the selected block, shown as a row under it. */
  selectedItem: ItemRef | null;
  /** What blocks fed by the site's data show, to list their items. */
  data: SiteData;
  pageSelected: boolean;
  issues: TreeIssue[];
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  actions: TreeActions;
  /** Above the page's layers: what belongs to the whole site. */
  top?: ReactNode;
}) {
  const {
    attach: fadeRef,
    className: fadeClass,
    style: fadeStyle,
  } = useScrollFade<HTMLDivElement>('y');
  /** The rows to open so that the selection shows. */
  const around = (id: string | null, item: ItemRef | null) =>
    id ? [...ancestorIds(tree, id), ...(item ? [id] : [])] : [];
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(around(selectedId, selectedItem)),
  );
  // Selecting a block on the preview opens the Sections around it
  // (adjusting state during render rather than in an effect).
  const selectionKey = `${selectedId}:${JSON.stringify(selectedItem)}`;
  const [seen, setSeen] = useState(selectionKey);
  if (selectionKey !== seen) {
    setSeen(selectionKey);
    const ids = around(selectedId, selectedItem);
    if (ids.some((id) => !open.has(id))) setOpen(new Set([...open, ...ids]));
  }
  useEffect(() => {
    document
      .querySelector('[data-outline-selected]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectionKey]);

  /** A block's items, as rows under it (the deepest level of the tree). */
  const itemsOf = (node: ComponentNode) => {
    const rows = drawnItems(node, data);
    return {
      rows: rows.slice(0, MAX_ROWS).map((row, index) => ({
        ref: row.ref,
        hidden: row.hidden,
        label: row.item.title || row.item.value || `Item ${index + 1}`,
      })),
      more: Math.max(0, rows.length - MAX_ROWS),
    };
  };

  const toggle = (ids: string[], value: boolean) =>
    setOpen((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  // Sections, and blocks that hold items.
  const containers = [
    ...containerIds(tree),
    ...allNodes(tree)
      .filter((node) => !node.children && itemsOf(node).rows.length > 0)
      .map((node) => node.id),
  ];
  const allOpen =
    containers.length > 0 && containers.every((id) => open.has(id));

  // ------------------------------------------------------- drag and drop
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const openTimer = useRef<{ id: string; timer: number } | null>(null);
  const clearTimer = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current.timer);
    openTimer.current = null;
  };
  const endDrag = () => {
    clearTimer();
    setDragId(null);
    setDrop(null);
  };

  const dragProps = (node: ComponentNode, isOpen: boolean) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.id);
      setDragId(node.id);
    },
    onDragEnd: endDrag,
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragId) return;
      const box = event.currentTarget.getBoundingClientRect();
      const y = (event.clientY - box.top) / box.height;
      const container = !!node.children;
      const position: DropPosition = container
        ? y < 0.25
          ? 'before'
          : y > 0.75
            ? 'after'
            : 'inside'
        : y < 0.5
          ? 'before'
          : 'after';
      if (!dropLocation(tree, dragId, node.id, position)) {
        setDrop(null);
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (
        !drop ||
        !('targetId' in drop) ||
        drop.targetId !== node.id ||
        drop.position !== position
      )
        setDrop({ targetId: node.id, position });
      // Hovering the middle of a closed Section opens it, like a folder.
      if (position === 'inside' && !isOpen && node.children?.length) {
        if (openTimer.current?.id !== node.id) {
          clearTimer();
          openTimer.current = {
            id: node.id,
            timer: window.setTimeout(() => toggle([node.id], true), OPEN_DELAY),
          };
        }
      } else clearTimer();
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      if (dragId && drop && 'targetId' in drop) {
        const to = dropLocation(tree, dragId, drop.targetId, drop.position);
        if (to) {
          actions.moveTo(dragId, to);
          if (drop.position === 'inside') toggle([drop.targetId], true);
        }
      }
      endDrag();
    },
  });

  /** The empty space under the outline: drop there to move to the end. */
  const rootDrop = {
    onDragOver: (event: DragEvent) => {
      if (!dragId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (!drop || !('root' in drop)) setDrop({ root: true });
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      // Only Sections sit on the page itself.
      if (dragId && tree.some((node) => node.id === dragId))
        actions.moveTo(dragId, { index: tree.length });
      endDrag();
    },
  };

  // ---------------------------------------------------------------- rows
  /** One item of a block: selecting it opens that item's own fields. */
  const renderItemRow = (
    block: ComponentNode,
    row: ReturnType<typeof itemsOf>['rows'][number],
    depth: number,
  ) => {
    const selected = selectedId === block.id && sameItem(selectedItem, row.ref);
    const key = 'index' in row.ref ? `i${row.ref.index}` : `r${row.ref.ref}`;
    return (
      <li key={key}>
        <div
          data-outline-selected={selected || undefined}
          className={`relative flex h-7 items-center gap-1 rounded-md pr-1 transition-colors ${
            selected
              ? 'bg-[var(--ui-primary-soft)]'
              : 'hover:bg-[var(--ui-glass)]'
          }`}
          style={{ paddingLeft: PAD + depth * INDENT }}
        >
          {Array.from({ length: depth }, (_, level) => (
            <span
              key={level}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px bg-[var(--ui-border)]"
              style={{ left: PAD + level * INDENT + 7.5 }}
            />
          ))}
          <span className="size-4 shrink-0" aria-hidden />
          <button
            type="button"
            aria-current={selected || undefined}
            onClick={() => actions.select(block.id, row.ref)}
            className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full ${
                selected ? 'bg-[var(--ui-primary)]' : 'bg-[var(--ui-faint)]'
              }`}
            />
            <span
              className={`truncate text-[0.8125rem] ${
                row.hidden
                  ? 'text-[var(--ui-muted)] line-through'
                  : selected
                    ? 'font-medium text-[var(--ui-fg)]'
                    : 'text-[var(--ui-fg)]'
              }`}
            >
              {row.label}
            </span>
            {row.hidden && (
              <EyeOff
                aria-label="Hidden"
                className="size-3.5 shrink-0 text-[var(--ui-muted)]"
              />
            )}
          </button>
        </div>
      </li>
    );
  };

  const renderRows = (nodes: ComponentNode[], depth: number) =>
    nodes.map((node) => {
      const definition = getDefinition(node.type);
      const typeLabel = definition?.label ?? `Unknown (${node.type})`;
      const { name, inferred } = nodeName(node);
      const sketch = nodeSketch(node);
      const items = itemsOf(node);
      const hasChildren =
        (!!node.children && node.children.length > 0) || items.rows.length > 0;
      const isOpen = open.has(node.id);
      const selected = selectedId === node.id && !selectedItem;
      const invalid = issues.some((issue) => issue.nodeId === node.id);
      const dropHere =
        drop && 'targetId' in drop && drop.targetId === node.id
          ? drop.position
          : null;
      const indent = PAD + depth * INDENT;

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey && event.key === 'ArrowUp') {
          event.preventDefault();
          actions.move(node.id, -1);
        } else if (event.altKey && event.key === 'ArrowDown') {
          event.preventDefault();
          actions.move(node.id, 1);
        } else if (event.key === 'ArrowRight' && hasChildren) {
          toggle([node.id], true);
        } else if (event.key === 'ArrowLeft' && hasChildren) {
          toggle([node.id], false);
        }
      };

      return (
        <li key={node.id}>
          <div
            data-outline-row={node.id}
            data-outline-selected={selected || undefined}
            {...dragProps(node, isOpen)}
            className={`group relative flex h-8 items-center gap-1 rounded-md pr-1 transition-colors ${
              selected
                ? 'bg-[var(--ui-primary-soft)]'
                : 'hover:bg-[var(--ui-glass)]'
            } ${dragId === node.id ? 'opacity-40' : ''} ${
              dropHere === 'inside'
                ? 'ring-2 ring-[var(--ui-primary)] ring-inset'
                : ''
            }`}
            style={{ paddingLeft: indent }}
          >
            {/* Guides: one line per level, under each parent's chevron. */}
            {Array.from({ length: depth }, (_, level) => (
              <span
                key={level}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-[var(--ui-border)]"
                style={{ left: PAD + level * INDENT + 7.5 }}
              />
            ))}

            {hasChildren ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={isOpen ? `Close ${name}` : `Open ${name}`}
                title="Alt-click opens or closes everything inside"
                onClick={(event) =>
                  toggle(
                    event.altKey ? containerIds([node]) : [node.id],
                    !isOpen,
                  )
                }
                className="grid size-4 shrink-0 place-items-center rounded text-[var(--ui-muted)] hover:text-[var(--ui-fg)]"
              >
                <ChevronRight
                  className={`size-3.5 transition-[rotate] ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}

            <button
              type="button"
              aria-current={selected || undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              title={typeLabel}
              onClick={() => actions.select(node.id, null)}
              onKeyDown={onKeyDown}
              className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span
                aria-hidden
                className={`grid shrink-0 place-items-center ${
                  selected
                    ? 'text-[var(--ui-primary)]'
                    : 'text-[var(--ui-muted)]'
                } ${sketch ? 'w-5' : 'size-4'}`}
              >
                {sketch && columnsBySketch[sketch] ? (
                  <ColumnsGlyph columns={columnsBySketch[sketch]} />
                ) : sketch ? (
                  <Sketch name={sketch} />
                ) : (
                  <ComponentIcon node={node} className="size-4" />
                )}
              </span>
              <span
                className={`truncate text-[0.8125rem] font-medium ${
                  inferred ? 'text-[var(--ui-muted)]' : 'text-[var(--ui-fg)]'
                }`}
              >
                {name}
              </span>
              {invalid && (
                <span
                  role="img"
                  aria-label="Needs attention"
                  className="size-2 shrink-0 rounded-full bg-[var(--ui-danger)]"
                />
              )}
            </button>

            <span className="hidden shrink-0 group-focus-within:flex group-hover:flex [&_.sc-ui-icon-button]:size-6 [&_svg]:size-3.5">
              {node.children && (
                <IconButton
                  variant="ghost"
                  label={`Add a block to ${name}`}
                  onClick={() => actions.addInto(node.id)}
                >
                  <Plus />
                </IconButton>
              )}
              <IconButton
                variant="ghost"
                label="Duplicate"
                onClick={() => actions.duplicate(node.id)}
              >
                <Copy />
              </IconButton>
              <IconButton
                variant="ghost"
                label={`Delete ${name}`}
                onClick={() => actions.remove(node.id)}
              >
                <Trash2 />
              </IconButton>
            </span>

            {(dropHere === 'before' || dropHere === 'after') && (
              <span
                aria-hidden
                className={`pointer-events-none absolute right-1 h-0.5 rounded-full bg-[var(--ui-primary)] ${
                  dropHere === 'before' ? '-top-px' : '-bottom-px'
                }`}
                style={{ left: indent + 20 }}
              />
            )}
          </div>
          {hasChildren &&
            isOpen &&
            node.children &&
            node.children.length > 0 && (
              <ul className="m-0 list-none p-0">
                {renderRows(node.children, depth + 1)}
              </ul>
            )}
          {isOpen && items.rows.length > 0 && (
            <ul className="m-0 list-none p-0">
              {items.rows.map((row) => renderItemRow(node, row, depth + 1))}
              {items.more > 0 && (
                <li
                  className="flex h-7 items-center text-xs text-[var(--ui-muted)]"
                  style={{ paddingLeft: PAD + (depth + 1) * INDENT + 20 }}
                >
                  and {items.more} more
                </li>
              )}
            </ul>
          )}
        </li>
      );
    });

  if (collapsed)
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
        <IconButton
          variant="ghost"
          label="Show layers"
          onClick={() => onCollapsedChange(false)}
        >
          <PanelLeftOpen />
        </IconButton>
        <IconButton
          variant="ghost"
          label="Add a section"
          onClick={() => actions.add()}
        >
          <Plus />
        </IconButton>
      </aside>
    );

  return (
    <aside
      aria-label="Page layers"
      className="flex w-72 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)]"
    >
      {top}
      <div className="flex items-center gap-1 px-3 pt-3 pb-1">
        <span className="sc-ui-overline flex-1">Layers</span>
        {containers.length > 0 && (
          <IconButton
            variant="ghost"
            label={allOpen ? 'Close all' : 'Open all'}
            onClick={() => toggle(containers, !allOpen)}
          >
            {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
          </IconButton>
        )}
        <IconButton
          variant="ghost"
          label="Add a section"
          onClick={() => actions.add()}
        >
          <Plus />
        </IconButton>
        <IconButton
          variant="ghost"
          label="Hide layers"
          onClick={() => onCollapsedChange(true)}
        >
          <PanelLeftClose />
        </IconButton>
      </div>

      <div
        ref={fadeRef}
        style={fadeStyle}
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 ${fadeClass}`}
      >
        {/* The page itself: selecting it opens the page settings. */}
        <button
          type="button"
          aria-current={pageSelected || undefined}
          onClick={actions.selectPage}
          className={`flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-left text-[0.8125rem] font-semibold transition-colors ${
            pageSelected
              ? 'bg-[var(--ui-primary-soft)] text-[var(--ui-primary)]'
              : 'hover:bg-[var(--ui-glass)]'
          }`}
        >
          <FileText className="size-4 shrink-0 text-[var(--ui-muted)]" />
          <span className="truncate">{title || 'Untitled page'}</span>
        </button>

        {tree.length === 0 ? (
          <button
            type="button"
            onClick={() => actions.add()}
            className="mt-1 flex h-8 items-center gap-2 rounded-md px-2 text-[0.8125rem] text-[var(--ui-muted)] hover:bg-[var(--ui-glass)] hover:text-[var(--ui-fg)]"
          >
            <Plus className="size-4" /> Add the first section
          </button>
        ) : (
          <ul className="m-0 list-none p-0" onDragLeave={clearTimer}>
            {renderRows(tree, 0)}
          </ul>
        )}

        {/* Drop here to move a block to the end of the page. */}
        <div {...rootDrop} className="relative min-h-8 flex-1">
          {drop && 'root' in drop && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 right-1 h-0.5 rounded-full bg-[var(--ui-primary)]"
              style={{ left: PAD + 20 }}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
