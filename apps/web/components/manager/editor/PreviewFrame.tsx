'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  isTrustedMessage,
  PREVIEW_DEBOUNCE_MS,
  type FromPreview,
  type ToPreview,
} from '@/lib/preview/messages';
import type { ItemRef } from '@/lib/components/items';
import type { ComponentNode, Site } from '@/lib/types';
import { fitScale, layoutWidth, type Device } from './devices';

function send(frame: HTMLIFrameElement | null, message: ToPreview) {
  frame?.contentWindow?.postMessage(message, window.location.origin);
}

/**
 * The preview: an iframe of /preview/..., which renders the page with the
 * public renderer. It loads once; after that the draft is posted to it
 * (debounced) and it re-renders in place.
 */
export function PreviewFrame({
  src,
  title,
  components,
  selectedId,
  selectedItem,
  site,
  readOnly,
  width,
  onSelect,
  onSelectSite,
  onAddSlot,
  onScroll,
  onMeasure,
}: {
  src: string;
  title: string;
  components: ComponentNode[];
  selectedId: string | null;
  selectedItem: ItemRef | null;
  /** The site settings as being edited, so the preview follows them. */
  site: Site;
  /** Showing a past version: no selection. */
  readOnly: boolean;
  width: Device;
  onSelect: (id: string, item?: ItemRef) => void;
  onSelectSite: () => void;
  /** An empty column was clicked: add a block to that Section, there. */
  onAddSlot: (sectionId: string, index: number) => void;
  /** The preview page scrolled to `y` (page px); 0 again after a reload. */
  onScroll?: (y: number) => void;
  /** The size the page is laid out at, and how far it is scaled down. */
  onMeasure?: (size: { pageWidth: number; scale: number }) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // Goes up each time the preview (re)loads and says it is listening.
  const [readyCount, setReadyCount] = useState(0);
  // A selection made by clicking in the preview needs no scrolling.
  const fromPreview = useRef(false);
  const onSelectRef = useRef({ onSelect, onSelectSite, onAddSlot, onScroll });
  useEffect(() => {
    onSelectRef.current = { onSelect, onSelectSite, onAddSlot, onScroll };
  });

  // Messages from the preview: only from our iframe, on our origin.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedMessage(event, frame.current?.contentWindow)) return;
      const message = event.data as FromPreview;
      if (message.type === 'preview:ready') {
        setReadyCount((count) => count + 1);
        onSelectRef.current.onScroll?.(0);
      } else if (message.type === 'preview:scroll')
        onSelectRef.current.onScroll?.(message.y);
      else if (message.type === 'preview:clicked') {
        fromPreview.current = true;
        onSelectRef.current.onSelect(message.id, message.item);
      } else if (message.type === 'preview:clicked-site')
        onSelectRef.current.onSelectSite();
      else if (message.type === 'preview:add')
        onSelectRef.current.onAddSlot(message.sectionId, message.index);
      else if (message.type === 'preview:key')
        // Replayed on the editor's window, where its shortcuts listen.
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: message.key,
            metaKey: message.metaKey,
            ctrlKey: message.ctrlKey,
            shiftKey: message.shiftKey,
          }),
        );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // The draft, at most once per pause in typing.
  useEffect(() => {
    if (readyCount === 0) return;
    const timer = setTimeout(
      () =>
        send(frame.current, {
          type: 'preview:render',
          title,
          components,
          readOnly,
        }),
      PREVIEW_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [readyCount, title, components, readOnly]);

  // The selection straight away: it is cheap and should feel instant.
  useEffect(() => {
    if (readyCount > 0) {
      send(frame.current, {
        type: 'preview:select',
        id: readOnly ? null : selectedId,
        item: readOnly ? null : selectedItem,
        reveal: !fromPreview.current,
      });
      fromPreview.current = false;
    }
  }, [readyCount, selectedId, selectedItem, readOnly]);

  // Site settings: name, logo, colours and menu follow the panel's edits.
  useEffect(() => {
    if (readyCount === 0) return;
    const timer = setTimeout(
      () => send(frame.current, { type: 'preview:site', site }),
      PREVIEW_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [readyCount, site]);

  // The space between the panels, and the browser window's width (what
  // a desktop visitor in this same window would get).
  const box = useRef<HTMLDivElement>(null);
  const [space, setSpace] = useState({ width: 0, height: 0, window: 0 });
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () =>
      setSpace({
        width: element.clientWidth,
        height: element.clientHeight,
        window: window.innerWidth,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Laid out at the device's real width, then scaled down to fit, so the
  // layout never changes because the editor's panels take room.
  const pageWidth = layoutWidth(width, space.window);
  const scale = fitScale(space.width, pageWidth);
  // Tells the editor, for the caption by its toolbar.
  useEffect(() => {
    onMeasure?.({ pageWidth, scale });
  }, [onMeasure, pageWidth, scale]);
  // The preview draws its selection ring larger by the inverse of this.
  useEffect(() => {
    if (readyCount > 0) send(frame.current, { type: 'preview:scale', scale });
  }, [readyCount, scale]);

  return (
    <div ref={box} className="relative flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
        {space.width > 0 && (
          // Takes the scaled size in the layout; the iframe inside keeps
          // its real size and is shrunk with a transform.
          <div
            className="shrink-0"
            style={{ width: pageWidth * scale, height: space.height }}
          >
            <iframe
              ref={frame}
              src={src}
              title="Page preview"
              // Desktop is the page itself, edge to edge; a tablet or a phone
              // is a framed screen.
              className={
                width === 'desktop'
                  ? 'bg-white'
                  : 'rounded-xl bg-white shadow-[var(--ui-shadow-sm)] ring-1 ring-[var(--ui-border)]'
              }
              style={{
                width: pageWidth,
                height: space.height / scale,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
