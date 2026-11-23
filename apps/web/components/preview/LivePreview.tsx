'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SitePage } from '@/components/site/SitePage';
import {
  isTrustedMessage,
  type FromPreview,
  type ToPreview,
} from '@/lib/preview/messages';
import type { ItemRef } from '@/lib/components/items';
import { getDefinition } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import { defaultTheme } from '@/lib/theme/defaultTheme';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { themeToCssVars } from '@/lib/theme/themeToCssVars';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode, MenuItem, Site } from '@/lib/types';

function post(message: FromPreview) {
  window.parent.postMessage(message, window.location.origin);
}

/**
 * Inside the editor's iframe: the real public page (SitePage), re-rendered
 * from React state whenever the editor posts a new draft. A click selects
 * the component under the pointer instead of following links.
 */
export function LivePreview({
  site: savedSite,
  themeVars: savedThemeVars,
  path,
  menu: savedMenu,
  data,
  initialTitle,
  initialComponents,
}: {
  site: Site;
  themeVars: CSSProperties;
  path: string;
  menu: MenuItem[];
  data: SiteData;
  initialTitle: string;
  initialComponents: ComponentNode[];
}) {
  // The site as the editor's Site settings panel has it (unsaved edits
  // included), so name, colours, look and menu order show as they change.
  const [site, setSite] = useState(savedSite);
  const themeVars = useMemo(
    () =>
      site === savedSite
        ? savedThemeVars
        : themeToCssVars(resolveTheme(defaultTheme, site.theme)),
    [site, savedSite, savedThemeVars],
  );
  const menu = useMemo(() => {
    const order = site.menuOrder ?? [];
    const rank = (item: MenuItem) => {
      if (item.path === '/') return -1;
      const at = order.indexOf(item.id);
      return at === -1 ? order.length : at;
    };
    return [...savedMenu].sort(
      (a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path),
    );
  }, [site.menuOrder, savedMenu]);
  const [content, setContent] = useState({
    title: initialTitle,
    components: initialComponents,
    readOnly: false,
  });
  // How far the editor scales this page down: the selection is drawn
  // larger by the inverse, so it is as clear at 28% as at 100%.
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<{
    id: string;
    item: ItemRef | null;
  } | null>(null);

  // Messages from the editor (the parent window, same origin only).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedMessage(event, window.parent)) return;
      const message = event.data as ToPreview;
      if (message.type === 'preview:render') {
        const { title, components, readOnly } = message;
        setContent({ title, components, readOnly });
      } else if (message.type === 'preview:scale') {
        setScale(message.scale);
      } else if (message.type === 'preview:site') {
        setSite(message.site);
      } else if (message.type === 'preview:select') {
        const next = message.id
          ? { id: message.id, item: message.item ?? null }
          : null;
        setSelected(next);
        if (next && message.reveal)
          scrollToMiddle(selectorFor(next.id, next.item));
      }
    };
    window.addEventListener('message', onMessage);
    // Tell the editor we are listening, so it sends the current draft.
    post({ type: 'preview:ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // A click selects what is under it at the deepest level: an item (a
  // card, a paragraph, a slide) if there is one, else the block. An
  // empty column asks the editor to add a block there. The header and
  // footer select the site. Links and photo viewers must not react while
  // editing, so the click stops here.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (content.readOnly) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-site-chrome]')) {
        post({ type: 'preview:clicked-site' });
        return;
      }
      const slot = target?.closest('[data-add-slot]');
      const sectionId = slot?.getAttribute('data-add-slot');
      if (slot && sectionId) {
        post({
          type: 'preview:add',
          sectionId,
          index: Number(slot.getAttribute('data-slot-index') ?? 0),
        });
        return;
      }
      const component = target?.closest('[data-component-id]');
      const id = component?.getAttribute('data-component-id');
      if (!component || !id) return;
      const itemElement = target?.closest('[data-item-field]');
      const item =
        itemElement && itemElement.closest('[data-component-id]') === component
          ? readItem(itemElement)
          : null;
      // The deepest level under the pointer: the item itself when there
      // is one. The way back up is the breadcrumb, Esc or the Layers tree.
      post({ type: 'preview:clicked', id, ...(item ? { item } : {}) });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [content.readOnly]);

  // The editor's shortcuts keep working after a click in the preview.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (event.key !== 'Escape' && !(mod && (key === 'z' || key === 's')))
        return;
      event.preventDefault();
      post({
        type: 'preview:key',
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
      });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // The preview is a picture of the page inside the editor, which draws
  // its own scroll position: no scrollbars of its own (it still scrolls).
  useEffect(() => {
    const root = document.documentElement;
    root.style.scrollbarWidth = 'none';
    return () => {
      root.style.removeProperty('scrollbar-width');
    };
  }, []);

  // Where the page is scrolled to: the editor hides its toolbar while you
  // scroll down and brings it back as you scroll up. Browsers already fire
  // scroll at most once a frame, so every event is posted.
  useEffect(() => {
    const onScroll = () => post({ type: 'preview:scroll', y: window.scrollY });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <SitePage
        site={site}
        themeVars={themeVars}
        title={content.title}
        path={path}
        components={content.components}
        menu={menu}
        data={data}
        editable
      />
      {/* Hidden items stay in place in the editor, ghosted. */}
      {/* Blocks are simply there while editing: entrance animations wait
          for an element to scroll into view, which an editor's preview
          should not depend on. Hidden items stay in place, ghosted (the
          more specific rule wins over the first). */}
      <style>{`
        main [style*="opacity"] { opacity: 1 !important; filter: none !important; transform: none !important; }
        main [data-item-field][data-item-hidden] { filter: grayscale(1) opacity(0.4) !important; }
      `}</style>
      {selected && !content.readOnly && (
        <>
          <SelectionOutline
            selector={selectorFor(selected.id, null)}
            label={selectionLabel(content.components, selected.id, null)}
            scale={scale}
            dashed={!!selected.item}
          />
          {selected.item && (
            <SelectionOutline
              selector={selectorFor(selected.id, selected.item)}
              label={selectionLabel(
                content.components,
                selected.id,
                selected.item,
              )}
              scale={scale}
            />
          )}
        </>
      )}
      {!content.readOnly && <HiddenTags />}
    </>
  );
}

/** An item element's data attributes as an ItemRef. */
function readItem(element: Element): ItemRef | null {
  const field = element.getAttribute('data-item-field');
  if (!field) return null;
  const ref = element.getAttribute('data-item-ref');
  if (ref) return { field, ref };
  const index = Number(element.getAttribute('data-item-index'));
  return Number.isInteger(index) ? { field, index } : null;
}

/** The marker element of a component, or of one item inside it. */
function selectorFor(id: string, item: ItemRef | null): string {
  const component = `[data-component-id="${CSS.escape(id)}"]`;
  if (!item) return component;
  const key =
    'ref' in item
      ? `[data-item-ref="${CSS.escape(item.ref)}"]`
      : `[data-item-index="${item.index}"]`;
  return `${component} [data-item-field="${CSS.escape(item.field)}"]${key}`;
}

/**
 * The box of a marked element. Items are marked on their own element; a
 * component's marker is a display: contents wrapper (no box of its own),
 * so the box around its children is measured instead.
 */
function wrapperRect(wrapper: Element): DOMRect | null {
  if (getComputedStyle(wrapper).display !== 'contents') {
    const rect = wrapper.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 ? rect : null;
  }
  const rects = [...wrapper.children]
    .map((child) => child.getBoundingClientRect())
    .filter((rect) => rect.width > 0 || rect.height > 0);
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function markerRect(selector: string): DOMRect | null {
  const wrapper = document.querySelector(selector);
  return wrapper ? wrapperRect(wrapper) : null;
}

/** The fixed header's height: the part of the view that is covered. */
const HEADER_PX = 72;

/**
 * Scroll the selection to the middle of what the header leaves visible, so
 * you can see which one it is. Taller than the view: its top goes just under
 * the header instead.
 */
function scrollToMiddle(selector: string) {
  // Wait a frame: the component may have only just been added.
  requestAnimationFrame(() => {
    const rect = markerRect(selector);
    if (!rect) return;
    const visible = window.innerHeight - HEADER_PX;
    const top =
      rect.height <= visible
        ? rect.top - HEADER_PX - (visible - rect.height) / 2
        : rect.top - HEADER_PX - 16;
    if (Math.abs(top) > 8) window.scrollBy({ top, behavior: 'smooth' });
  });
}

/**
 * The selection: drawn *inside* the selected element's box and clamped to
 * the visible area, so it is never cut off by the screen's edges or pushed
 * out of view (a full-width Section touches both sides). A blue ring with a
 * thin white one inside it reads on light and dark backgrounds alike, a
 * faint tint shows the extent, and a tag names what is selected. Follows
 * the element as the page scrolls, resizes or animates. Preview only:
 * inline styles, so no editor CSS is added to the site's stylesheet.
 */
function SelectionOutline({
  selector,
  label,
  scale,
  dashed = false,
}: {
  selector: string;
  /** "Section", "Block", "Item"... */
  label: string;
  /** The editor's zoom of this page (1 = actual size). */
  scale: number;
  /** The component around a selected item: shown, but quieter. */
  dashed?: boolean;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const next = markerRect(selector);
      setRect((current) =>
        current &&
        next &&
        current.x === next.x &&
        current.y === next.y &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next,
      );
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [selector]);

  if (!rect) return null;
  // Only the part that is on screen, and below the fixed header.
  const viewW = document.documentElement.clientWidth;
  const left = Math.max(0, rect.left);
  const right = Math.min(viewW, rect.right);
  const top = Math.max(HEADER_PX, rect.top);
  const bottom = Math.min(window.innerHeight, rect.bottom);
  if (right <= left || bottom <= top) return null;
  // Sizes that stay the same on screen whatever the zoom.
  const px = (size: number) => size / Math.min(1, scale || 1);
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left,
        top,
        width: right - left,
        height: bottom - top,
        boxSizing: 'border-box',
        borderRadius: px(4),
        background: dashed ? 'transparent' : 'rgb(37 99 235 / 0.06)',
        boxShadow: dashed
          ? `inset 0 0 0 ${px(2)}px rgb(37 99 235 / 0.55)`
          : `inset 0 0 0 ${px(3)}px #2563eb, inset 0 0 0 ${px(5)}px rgb(255 255 255 / 0.9)`,
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    >
      {!dashed && (
        <span
          style={{
            position: 'absolute',
            left: px(8),
            top: px(8),
            padding: `${px(2)}px ${px(8)}px`,
            borderRadius: 999,
            background: '#2563eb',
            color: '#fff',
            font: `600 ${px(11)}px/1.5 system-ui, sans-serif`,
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/** What a selected thing is called in the tag. */
function selectionLabel(
  components: ComponentNode[],
  id: string,
  item: ItemRef | null,
): string {
  if (item) return 'Item';
  const node = findNode(components, id);
  const definition = node && getDefinition(node.type);
  return definition?.acceptsChildren ? definition.label : 'Block';
}

/** A small "Hidden" tag on each hidden item, following it like the outline. */
function HiddenTags() {
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    let frame = 0;
    let last = '';
    const update = () => {
      const next = [...document.querySelectorAll('[data-item-hidden]')]
        // A slide that is not the current one is there but transparent.
        .filter((element) => getComputedStyle(element).opacity !== '0')
        .map(wrapperRect)
        .filter((rect): rect is DOMRect => rect !== null);
      const key = next.map((r) => `${r.x},${r.y}`).join(';');
      if (key !== last) {
        last = key;
        setRects(next);
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, []);

  return rects.map((rect, index) => (
    <span
      key={index}
      aria-hidden
      style={{
        position: 'fixed',
        left: rect.left + 8,
        top: rect.top + 8,
        padding: '2px 8px',
        borderRadius: 999,
        background: 'rgb(15 23 42 / 0.85)',
        color: '#fff',
        font: '600 11px/1.4 system-ui, sans-serif',
        pointerEvents: 'none',
        zIndex: 2147483646,
      }}
    >
      Hidden
    </span>
  ));
}
