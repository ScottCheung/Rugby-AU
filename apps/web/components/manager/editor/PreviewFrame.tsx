'use client';

import { useEffect, useRef, useState } from 'react';
import {
  isTrustedMessage,
  PREVIEW_DEBOUNCE_MS,
  type FromPreview,
  type ToPreview,
} from '@/lib/preview/messages';
import type { ComponentNode } from '@/lib/types';
import type { PreviewWidth } from './EditorTopBar';

function send(frame: HTMLIFrameElement | null, message: ToPreview) {
  frame?.contentWindow?.postMessage(message, window.location.origin);
}

/** A phone-sized viewport, so the site's real mobile breakpoints apply. */
const MOBILE_WIDTH = 390;

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
  readOnly,
  width,
  onSelect,
}: {
  src: string;
  title: string;
  components: ComponentNode[];
  selectedId: string | null;
  /** Showing a past version: no selection. */
  readOnly: boolean;
  width: PreviewWidth;
  onSelect: (id: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // Goes up each time the preview (re)loads and says it is listening.
  const [readyCount, setReadyCount] = useState(0);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Messages from the preview: only from our iframe, on our origin.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedMessage(event, frame.current?.contentWindow)) return;
      const message = event.data as FromPreview;
      if (message.type === 'preview:ready') setReadyCount((count) => count + 1);
      else if (message.type === 'preview:clicked')
        onSelectRef.current(message.id);
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
    if (readyCount > 0)
      send(frame.current, {
        type: 'preview:select',
        id: readOnly ? null : selectedId,
      });
  }, [readyCount, selectedId, readOnly]);

  return (
    <div className="flex h-full justify-center">
      <iframe
        ref={frame}
        src={src}
        title="Page preview"
        className="h-full rounded-xl border border-[var(--ui-border)] bg-white shadow-[var(--ui-shadow-sm)]"
        style={{ width: width === 'mobile' ? MOBILE_WIDTH : '100%' }}
      />
    </div>
  );
}
