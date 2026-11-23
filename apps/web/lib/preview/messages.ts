import type { ItemRef } from '../components/items';
import type { ComponentNode, Site } from '../types';

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
  | {
      type: 'preview:select';
      id: string | null;
      /** An item inside that component, outlined instead of the whole. */
      item?: ItemRef | null;
      /**
       * Scroll it to the middle of the view. Set when the selection came
       * from the Layers tree or the inspector; a click in the preview
       * already has it under the pointer, so the page must not jump.
       */
      reveal?: boolean;
    }
  /**
   * How much the preview is scaled down in the editor (1 = actual size).
   * The selection's ring and tag are drawn larger by the inverse, so they
   * stay as thick and as readable at 28% as at 100%.
   */
  | { type: 'preview:scale'; scale: number }
  /** The site's settings as being edited: name, logo, colours, menu... */
  | { type: 'preview:site'; site: Site };

/** Preview -> editor. */
export type FromPreview =
  | { type: 'preview:ready' }
  /** A component, or the item under the pointer inside it. */
  | { type: 'preview:clicked'; id: string; item?: ItemRef }
  /** The site's header or footer. */
  | { type: 'preview:clicked-site' }
  /** An empty column of a Section: add a block there. */
  | { type: 'preview:add'; sectionId: string; index: number }
  /** The page scrolled; `y` is its scroll position in page px. */
  | { type: 'preview:scroll'; y: number }
  /**
   * An editor shortcut pressed while the preview has focus (after a click
   * in it): Esc, undo / redo, save. The editor handles it as its own.
   */
  | {
      type: 'preview:key';
      key: string;
      metaKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
    };

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
