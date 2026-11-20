'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  createElement,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { getSiteComponent } from '@/components/site/siteComponents';
import { getDefinition } from '@/lib/components/registry';
import type { Location } from '@/lib/components/tree';
import type { ComponentNode, Site } from '@/lib/types';
import type { DragData, DropData } from './dnd';
import { useEditor } from './editorContext';
import { SiteLogo } from '@/components/primitives/SiteLogo';

/**
 * The page as visitors will see it, rendered with the site's own components
 * and theme, plus editing chrome: click a block to select it, drag it by its
 * handle, drop between blocks or into a Section.
 */
export function Canvas({
  site,
  themeVars,
  device,
}: {
  site: Site;
  themeVars: CSSProperties;
  device: 'desktop' | 'mobile';
}) {
  const editor = useEditor();

  return (
    <div
      className="mx-auto overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_32px_rgb(15_23_42/0.10)] transition-[max-width] duration-300"
      // A phone-sized canvas: Section's container query then stacks two columns.
      style={{ maxWidth: device === 'mobile' ? 390 : '100%' }}
    >
      <div
        style={themeVars}
        className="@container min-h-[60vh] bg-background font-site text-text"
        // Links inside the page must not navigate away while editing.
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest('a'))
            event.preventDefault();
        }}
        onClick={() => editor.select(null)}
        onMouseLeave={() => editor.hover(null)}
      >
        <header className="bg-brand px-5 py-3 text-brand-contrast">
          <span className="flex items-center gap-3 font-bold">
            <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
            {site.name}
          </span>
        </header>
        <div
          className={`flex flex-col gap-site-md px-site-sm pt-12 pb-site-lg ${device === 'desktop' ? 'sm:px-site-md' : ''}`}
        >
          <NodeList nodes={editor.tree} />
        </div>
      </div>
    </div>
  );
}

/** A list of blocks (page root or a Section's children) and the slot after them. */
function NodeList({
  nodes,
  parentId,
}: {
  nodes: ComponentNode[];
  parentId?: string;
}) {
  return (
    <>
      {nodes.map((node) => (
        <CanvasNode key={node.id} node={node} />
      ))}
      <EndSlot
        at={{ parentId, index: nodes.length }}
        empty={nodes.length === 0}
        root={parentId === undefined}
      />
    </>
  );
}

function CanvasNode({ node }: { node: ComponentNode }) {
  const editor = useEditor();
  const definition = getDefinition(node.type);
  const label = definition?.label ?? `Unknown (${node.type})`;
  const selected = editor.selectedId === node.id;
  const hovered = editor.hoveredId === node.id && !editor.dragging;
  const hasIssues = editor.issues.some((issue) => issue.nodeId === node.id);
  const dropHere =
    editor.dropTarget?.nodeId === node.id ? editor.dropTarget.edge : undefined;

  const { setNodeRef: setDropRef } = useDroppable({
    id: `node:${node.id}`,
    data: { kind: 'node', nodeId: node.id } satisfies DropData,
  });
  const {
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({
    id: `drag:${node.id}`,
    data: { kind: 'node', nodeId: node.id, label } satisfies DragData,
  });

  const stop = (handler: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };

  let content: ReactNode;
  if (!definition) {
    content = (
      <div className="rounded-site border-2 border-dashed border-amber-400 p-4 text-sm text-amber-700">
        This block ({node.type}) is no longer in the library. Remove it to save
        the page.
      </div>
    );
  } else {
    // Render the draft as it is, even while a field is still empty or invalid:
    // the canvas should show work in progress, the save step validates.
    content = createElement(
      getSiteComponent(definition.type),
      { ...definition.defaultProps, ...node.props, siteSlug: editor.siteSlug },
      definition.acceptsChildren ? (
        <NodeList nodes={node.children ?? []} parentId={node.id} />
      ) : null,
    );
  }

  return (
    <div
      // The block is both a drop target and the thing being dragged.
      ref={(element) => {
        setDropRef(element);
        setDragRef(element);
      }}
      onClick={stop(() => editor.select(node.id))}
      onMouseOver={stop(() => editor.hover(node.id))}
      className={`relative rounded-site outline-offset-4 transition-[outline-color,opacity] ${
        selected
          ? 'outline-2 outline-[var(--ui-primary)]'
          : hasIssues
            ? 'outline-2 outline-dashed outline-red-500'
            : hovered
              ? 'outline-1 outline-dashed outline-[var(--ui-primary)]'
              : 'outline-0 outline-transparent'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      {(selected || hovered || hasIssues) && (
        <div
          className="absolute -top-2 left-0 z-20 flex -translate-y-full items-center gap-0.5 rounded-full bg-[var(--ui-primary)] py-0.5 pr-1.5 pl-0.5 font-sans text-xs font-semibold whitespace-nowrap text-white shadow-md"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            aria-label={`Drag ${label}`}
            className="grid size-6 cursor-grab place-items-center rounded-full hover:bg-white/20 active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
          </button>
          <span className="px-1">{label}</span>
          {hasIssues && (
            <span className="rounded-full bg-white/25 px-1.5">
              Needs attention
            </span>
          )}
          {selected && (
            <>
              <ChipButton
                label="Move up"
                onClick={() => editor.moveUp(node.id)}
              >
                <ArrowUp className="size-3.5" />
              </ChipButton>
              <ChipButton
                label="Move down"
                onClick={() => editor.moveDown(node.id)}
              >
                <ArrowDown className="size-3.5" />
              </ChipButton>
              <ChipButton
                label="Duplicate"
                onClick={() => editor.duplicate(node.id)}
              >
                <Copy className="size-3.5" />
              </ChipButton>
              <ChipButton label="Delete" onClick={() => editor.remove(node.id)}>
                <Trash2 className="size-3.5" />
              </ChipButton>
            </>
          )}
        </div>
      )}
      {dropHere && <DropLine edge={dropHere} />}
      {content}
    </div>
  );
}

function ChipButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-full hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function DropLine({ edge }: { edge: 'before' | 'after' }) {
  return (
    <div
      className={`pointer-events-none absolute right-0 left-0 z-30 h-1 rounded-full bg-[var(--ui-primary)] shadow-[0_0_0_3px_white] ${
        edge === 'before' ? '-top-3' : '-bottom-3'
      }`}
    />
  );
}

/**
 * The drop slot after the last block of a list. Always visible in an empty
 * Section (so it never collapses to nothing); otherwise only while dragging.
 */
function EndSlot({
  at,
  empty,
  root,
}: {
  at: Location;
  empty: boolean;
  root: boolean;
}) {
  const editor = useEditor();
  const id = `zone:${at.parentId ?? 'root'}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { kind: 'zone', at } satisfies DropData,
  });
  const active =
    isOver &&
    editor.dropTarget?.nodeId === undefined &&
    editor.dropTarget?.at.parentId === at.parentId;

  if (!empty && !editor.dragging)
    return <div ref={setNodeRef} className="col-span-full h-0" />;

  return (
    <div
      ref={setNodeRef}
      className={`col-span-full flex items-center justify-center gap-2 rounded-site border-2 border-dashed font-sans text-sm transition-colors ${
        empty ? (root ? 'min-h-48' : 'min-h-24') : 'min-h-12'
      } ${
        active
          ? 'border-[var(--ui-primary)] bg-[color-mix(in_oklch,var(--ui-primary),transparent_88%)] text-[var(--ui-primary)]'
          : 'border-muted-text/30 text-muted-text'
      }`}
    >
      <Plus className="size-4" />
      {root && empty
        ? 'Drag a component here, or click one on the left'
        : empty
          ? 'Drop components into this section'
          : 'Drop here'}
    </div>
  );
}
