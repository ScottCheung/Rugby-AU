import type { ComponentNode } from '../types';

/**
 * The messages between the editor and its preview iframe. Both run on the
 * same origin, and each side accepts only messages from that origin and
 * from the other window (see PreviewFrame and LivePreview).
 */

/** Editor -> preview. */
export type ToPreview =
  | {
      type: 'preview:render';
      title: string;
      components: ComponentNode[];
      /** A past version being viewed: clicks do not select anything. */
      readOnly: boolean;
    }
  | { type: 'preview:select'; id: string | null };

/** Preview -> editor. */
export type FromPreview =
  { type: 'preview:ready' } | { type: 'preview:clicked'; id: string };

/** How long the editor waits after the last edit before re-rendering. */
export const PREVIEW_DEBOUNCE_MS = 150;

/** True for a message from `expected` on this page's own origin. */
export function isTrustedMessage(
  event: MessageEvent,
  expected: MessageEventSource | null | undefined,
): boolean {
  return (
    event.origin === window.location.origin &&
    expected != null &&
    event.source === expected &&
    typeof event.data === 'object' &&
    event.data !== null &&
    typeof event.data.type === 'string'
  );
}
