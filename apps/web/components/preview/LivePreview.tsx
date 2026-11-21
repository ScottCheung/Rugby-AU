'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { SitePage } from '@/components/site/SitePage';
import {
  isTrustedMessage,
  type FromPreview,
  type ToPreview,
} from '@/lib/preview/messages';
import type { SiteData } from '@/lib/news';
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
  site,
  themeVars,
  path,
  menu,
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
  const [content, setContent] = useState({
    title: initialTitle,
    components: initialComponents,
    readOnly: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Messages from the editor (the parent window, same origin only).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedMessage(event, window.parent)) return;
      const message = event.data as ToPreview;
      if (message.type === 'preview:render') {
        const { title, components, readOnly } = message;
        setContent({ title, components, readOnly });
      } else if (message.type === 'preview:select') {
        setSelectedId(message.id);
        if (message.id) scrollIntoViewIfHidden(message.id);
      }
    };
    window.addEventListener('message', onMessage);
    // Tell the editor we are listening, so it sends the current draft.
    post({ type: 'preview:ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // A click selects the innermost component under it. Links and photo
  // viewers must not react while editing, so the click stops here.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (content.readOnly) return;
      const target =
        event.target instanceof Element
          ? event.target.closest('[data-component-id]')
          : null;
      const id = target?.getAttribute('data-component-id');
      if (id) post({ type: 'preview:clicked', id });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [content.readOnly]);

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
      {selectedId && !content.readOnly && <SelectionOutline id={selectedId} />}
    </>
  );
}

/**
 * The box around everything a component draws. Its wrapper is
 * display: contents (no box of its own), so measure its children.
 */
function componentRect(id: string): DOMRect | null {
  const wrapper = document.querySelector(
    `[data-component-id="${CSS.escape(id)}"]`,
  );
  if (!wrapper) return null;
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

function scrollIntoViewIfHidden(id: string) {
  // Wait a frame: the component may have only just been added.
  requestAnimationFrame(() => {
    const rect = componentRect(id);
    if (!rect) return;
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (!visible)
      window.scrollBy({
        top: rect.top - window.innerHeight / 4,
        behavior: 'smooth',
      });
  });
}

/**
 * An outline drawn over the selected component, following it as the page
 * scrolls, resizes or animates. Preview only: inline styles, so no editor
 * CSS is added to the site's stylesheet.
 */
function SelectionOutline({ id }: { id: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const next = componentRect(id);
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
  }, [id]);

  if (!rect) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: rect.left - 2,
        top: rect.top - 2,
        width: rect.width + 4,
        height: rect.height + 4,
        outline: '2px solid #2563eb',
        outlineOffset: 0,
        borderRadius: 4,
        boxShadow: '0 0 0 4px rgb(37 99 235 / 0.2)',
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    />
  );
}
