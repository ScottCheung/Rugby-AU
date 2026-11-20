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
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {
  Container,
  PageColumnBlock,
} from '@/components/primitives/Container';
import { NoMotion } from '@/components/site/Reveal';
import { getSiteComponent } from '@/components/site/siteComponents';
import { rootBlockWidth } from '@/lib/components/pageWidth';
import { getDefinition } from '@/lib/components/registry';
import type { Location } from '@/lib/components/tree';
import type { ComponentNode, Site } from '@/lib/types';
import type { DragData, DropData } from './dnd';
import { devices, fitScale, previewWidth, type Device } from './devices';
import { useEditor } from './editorContext';
import { SiteLogo } from '@/components/primitives/SiteLogo';

/** The browser window's width (0 before the first render in the browser). */
function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return width;
}

/** The canvas zoom, so editing chrome can stay readable when it is small. */
const ScaleContext = createContext(1);

/**
 * The page as visitors will see it, rendered with the site's own components
 * and theme, plus editing chrome: click a block to select it, drag it by its
 * handle, drop between blocks or into a Section.
 *
 * The page is laid out at the device's real width and scaled down to fit,
 * so a desktop preview has the same columns as a desktop screen.
 */
export function Canvas({
  site,
  themeVars,
  device,
  menu,
}: {
  site: Site;
  themeVars: CSSProperties;
  device: Device;
  /** The site's top-level pages, as the public header lists them. */
  menu: { id: string; label: string; current: boolean }[];
}) {
  const editor = useEditor();
  // Same rule as the public page: a full-width first block is a hero, and the
  // header floats over it instead of taking its own band.
  const heroFirst =
    !!editor.tree[0] && rootBlockWidth(editor.tree[0]) === 'full-width';
  const windowWidth = useWindowWidth();
  const { label } = devices[device];
  const width = previewWidth(device, windowWidth);
  const outer = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [height, setHeight] = useState(0);

  // Track the space the editor gives the canvas and the page's own height.
  useEffect(() => {
    const measure = () => {
      if (outer.current) setAvailable(outer.current.clientWidth);
      if (frame.current) setHeight(frame.current.offsetHeight);
    };
    // Measure straight away too: some browsers delay observer callbacks
    // for background tabs, and the canvas stays hidden until measured.
    measure();
    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  const scale = fitScale(available, width);

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-center text-xs font-semibold text-[var(--ui-muted)]">
        {label} · {width}px · {Math.round(scale * 100)}%
      </p>
      <div
        ref={outer}
        className="relative w-full overflow-hidden"
        // A scaled element keeps its full layout size, so reserve only the
        // scaled height. Hidden until measured, to avoid a full-size flash.
        style={{
          height: height ? height * scale : undefined,
          visibility: available ? 'visible' : 'hidden',
        }}
      >
        <div
          ref={frame}
          className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_32px_rgb(15_23_42/0.10)]"
          style={{
            width,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            // Centre a page narrower than the space (e.g. the phone).
            marginLeft: Math.max(0, (available - width * scale) / 2),
          }}
        >
          {/* No entrance animations while editing: blocks are just there. */}
          <NoMotion>
            <ScaleContext.Provider value={scale}>
              <div
                style={themeVars}
                className="@container/page relative min-h-[60vh] bg-background font-site text-text"
                // Links must not navigate away and photos must not open full size
                // while editing: a click on the canvas only selects.
                onClickCapture={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      'a, [data-lightbox-index]',
                    )
                  )
                    event.preventDefault();
                }}
                onClick={() => editor.select(null)}
                onMouseLeave={() => editor.hover(null)}
              >
                {/* Mirrors SiteHeader. Its breakpoints are container queries
                  on this page, so they follow the preview width, not the window. */}
                <header
                  className={
                    heroFirst
                      ? 'absolute inset-x-0 top-0 z-50'
                      : 'surface-strong relative bg-brand text-brand-contrast'
                  }
                  style={
                    heroFirst
                      ? {
                          color: 'var(--header-text, #fff)',
                          textShadow:
                            '0 1px 2px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.5)',
                        }
                      : undefined
                  }
                >
                  <Container className="relative flex h-16 items-center justify-between gap-4 @3xl:h-[72px] @3xl:gap-6">
                    <span className="site-heading flex min-w-0 items-center gap-3 text-lg font-bold @3xl:text-xl">
                      <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
                      <span className="truncate">{site.name}</span>
                    </span>
                    <nav aria-label="Main" className="hidden @3xl:block">
                      <ul className="m-0 flex list-none gap-1 p-0 whitespace-nowrap">
                        {menu.map((item) => (
                          <li key={item.id}>
                            <span
                              className={`block rounded-full px-3 py-1.5 text-sm font-semibold ${
                                item.current
                                  ? 'bg-brand-contrast text-brand'
                                  : ''
                              }`}
                            >
                              {item.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    <span
                      aria-hidden
                      className="relative grid size-11 shrink-0 place-items-center @3xl:hidden"
                    >
                      <span className="relative block h-4 w-6">
                        <span className="absolute left-0 top-0 block h-0.5 w-6 rounded bg-current" />
                        <span className="absolute left-0 top-[7px] block h-0.5 w-6 rounded bg-current" />
                        <span className="absolute left-0 top-[14px] block h-0.5 w-6 rounded bg-current" />
                      </span>
                    </span>
                  </Container>
                </header>
                {/* Like the public page: no page-wide container, each block
                  decides its width (see NodeList). */}
                <div
                  className={`flex flex-col pb-site-lg ${
                    heroFirst ? '' : 'pt-site-lg'
                  }`}
                >
                  <NodeList nodes={editor.tree} />
                </div>
              </div>
            </ScaleContext.Provider>
          </NoMotion>
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
  const root = parentId === undefined;
  const endSlot = (
    <EndSlot
      at={{ parentId, index: nodes.length }}
      empty={nodes.length === 0}
      root={root}
    />
  );
  return (
    <>
      {nodes.map((node) => {
        const block = <CanvasNode key={node.id} node={node} nested={!root} />;
        // Same rule as RenderTree: page-level blocks sit in the page column
        // unless a Section asks to be full width.
        if (!root || rootBlockWidth(node) !== 'contained') return block;
        // Same flow spacing as RenderTree, for every block type.
        return <PageColumnBlock key={node.id}>{block}</PageColumnBlock>;
      })}
      {endSlot}
    </>
  );
}

function CanvasNode({
  node,
  nested,
}: {
  node: ComponentNode;
  nested: boolean;
}) {
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

  const scale = useContext(ScaleContext);
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
      {
        ...definition.defaultProps,
        ...node.props,
        siteSlug: editor.siteSlug,
        nested,
        data: editor.siteData,
      },
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
          className="absolute -top-2 left-0 z-20 flex items-center gap-0.5 rounded-full bg-[var(--ui-primary)] py-0.5 pr-1.5 pl-0.5 font-sans text-xs font-semibold whitespace-nowrap text-white shadow-md"
          onClick={(event) => event.stopPropagation()}
          // Undo the canvas zoom so the toolbar stays a readable size.
          style={{
            transform: `translateY(-100%) scale(${1 / scale})`,
            transformOrigin: 'left bottom',
          }}
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

  // Hidden: out of the flow, so it adds no gap and the canvas spacing
  // matches the live page. It only needs a real box while dragging.
  if (!empty && !editor.dragging)
    return <div ref={setNodeRef} className="absolute h-0 w-0" />;

  const slot = (
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
  // On the page itself the slot sits in the page column, like blocks do.
  return root ? <Container>{slot}</Container> : slot;
}
