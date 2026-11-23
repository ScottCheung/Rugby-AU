'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';

/**
 * A scroller without a scrollbar: the edge that has more to scroll to
 * fades out, the edge you are at stays crisp, and a scroller that fits
 * has no fade at all. Ported from scott-ui's ScrollableContainer.
 *
 *   const fade = useScrollFade<HTMLDivElement>('y');
 *   <div ref={fade.attach} className={`overflow-y-auto ${fade.className}`} style={fade.style}>
 *
 * `.scroll-fade` (app/manager/manager.css) hides the scrollbar and stops
 * the scroll from chaining into the page behind.
 */
export function useScrollFade<T extends HTMLElement>(
  axis: 'x' | 'y' = 'y',
  size = 28,
) {
  // A state, not a ref object: the scroller may mount after the hook does.
  const [element, setElement] = useState<T | null>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    if (!element) return;
    const [offset, room, view] =
      axis === 'y'
        ? [element.scrollTop, element.scrollHeight, element.clientHeight]
        : [element.scrollLeft, element.scrollWidth, element.clientWidth];
    const next = { start: offset <= 4, end: offset + view >= room - 4 };
    setEdge((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
  }, [element, axis]);

  useEffect(() => {
    if (!element) return;
    // (The observer reports once as it starts, which sets the first state.)
    element.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    // Content added or removed changes how far it scrolls.
    const mutation = new MutationObserver(update);
    mutation.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener('scroll', update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [element, update]);

  const direction = axis === 'y' ? 'to bottom' : 'to right';
  const from = edge.start ? 'black 0' : `transparent 0, black ${size}px`;
  const to = edge.end
    ? 'black 100%'
    : `black calc(100% - ${size}px), transparent 100%`;
  const mask =
    edge.start && edge.end
      ? undefined
      : `linear-gradient(${direction}, ${from}, ${to})`;
  const style: CSSProperties | undefined = mask
    ? { maskImage: mask, WebkitMaskImage: mask }
    : undefined;

  return { attach: setElement, className: 'scroll-fade', style };
}
