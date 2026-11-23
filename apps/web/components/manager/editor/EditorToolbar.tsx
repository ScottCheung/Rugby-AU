'use client';

import {
  ExternalLink,
  House,
  Expand,
  Monitor,
  Redo2,
  Shrink,
  Smartphone,
  Undo2,
} from 'lucide-react';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Badge } from '@scottcheung/ui';
import { IconButton, SegmentedControl } from '@scottcheung/ui/client';
import { useScrollFade } from '../useScrollFade';
import { PageSwitcher, type SwitcherSite } from './PageSwitcher';

export type { Device as PreviewWidth } from './devices';
import type { Device as PreviewWidth } from './devices';

/** Scrolled less than this (page px), the toolbar always shows. */
const NEAR_TOP = 48;
/** Scroll moves smaller than this (page px) are ignored, so jitter does not flicker it. */
const JITTER = 4;

/**
 * Whether the floating toolbar is tucked away: hidden while the preview
 * scrolls down, back as soon as it scrolls up or returns near the top.
 * `onScroll` takes the preview's scroll position; `show` brings it back
 * (the pointer reaching the bottom edge).
 */
export function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const onScroll = useCallback((y: number) => {
    const delta = y - last.current;
    if (y < NEAR_TOP) setHidden(false);
    else if (delta > JITTER) setHidden(true);
    else if (delta < -JITTER) setHidden(false);
    else return; // Too small to count: keep measuring from the same point.
    last.current = y;
  }, []);
  const show = useCallback(() => setHidden(false), []);
  return { hidden, onScroll, show };
}

/**
 * A tablet held sideways: wide, with its home button at the end. lucide's
 * Tablet is a taller rectangle that reads as a second phone beside
 * Smartphone, so the two sizes are drawn apart in shape as well.
 */
function TabletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Tablet"
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M18.5 12h.01" />
    </svg>
  );
}

/**
 * The editor's toolbar, floating at the bottom of the canvas, with a caption under it: where you are
 * (back to all sites; switch site or page), history (undo, redo), how you look at it (width, full
 * screen, live page), and where the work stands (status) with what to do
 * about it (the `actions` slot: save, publish...). Styles: .editor-toolbar
 * in app/manager/manager.css.
 */
export function EditorToolbar({
  hidden,
  caption,
  sites,
  siteSlug,
  pages,
  pageId,
  onNavigate,
  width,
  onWidthChange,
  fullScreen,
  onFullScreenChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  liveUrl,
  status,
  actions,
}: {
  /** Tucked below the canvas edge (see useHideOnScroll). */
  hidden: boolean;
  /** Where you are and how the preview is sized, in small type under the bar. */
  caption: ReactNode;
  sites: SwitcherSite[];
  siteSlug: string;
  pages: { id: string; title: string; path: string }[];
  pageId: string;
  /** Leave the editor; the editor asks first if there are unsaved changes. */
  onNavigate: (href: string) => void;
  width: PreviewWidth;
  onWidthChange: (width: PreviewWidth) => void;
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** The public page, or undefined while it has never been published. */
  liveUrl?: string;
  status: ReactNode;
  actions: ReactNode;
}) {
  const {
    attach: fadeRef,
    className: fadeClass,
    style: fadeStyle,
  } = useScrollFade<HTMLDivElement>('x', 20);
  return (
    <div className="editor-dock" data-hidden={hidden || undefined}>
      <div role="toolbar" aria-label="Page editor" className="editor-toolbar">
        <div
          ref={fadeRef}
          style={fadeStyle}
          className={`editor-toolbar__scroll ${fadeClass}`}
        >
          <div className="editor-toolbar__group">
            <IconButton
              variant="ghost"
              label="All sites"
              onClick={() => onNavigate('/manager')}
            >
              <House />
            </IconButton>
            <PageSwitcher
              sites={sites}
              siteSlug={siteSlug}
              pages={pages}
              pageId={pageId}
              onNavigate={onNavigate}
            />
          </div>

          <div className="editor-toolbar__group">
            <IconButton
              variant="ghost"
              label="Undo (⌘Z)"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 />
            </IconButton>
            <IconButton
              variant="ghost"
              label="Redo (⇧⌘Z)"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 />
            </IconButton>
          </div>

          <div className="editor-toolbar__group">
            <SegmentedControl
              ariaLabel="Preview width"
              value={width}
              onValueChange={(value) => onWidthChange(value as PreviewWidth)}
              options={[
                { value: 'desktop', label: <Monitor aria-label="Desktop" /> },
                { value: 'tablet', label: <TabletIcon /> },
                { value: 'mobile', label: <Smartphone aria-label="Mobile" /> },
              ]}
            />
            <IconButton
              variant="ghost"
              label={fullScreen ? 'Show the panels' : 'Full-screen preview'}
              onClick={() => onFullScreenChange(!fullScreen)}
            >
              {fullScreen ? <Shrink /> : <Expand />}
            </IconButton>
            {liveUrl && (
              <IconButton
                variant="ghost"
                label="Open the live page in a new tab"
                onClick={() => window.open(liveUrl, '_blank', 'noreferrer')}
              >
                <ExternalLink />
              </IconButton>
            )}
          </div>

          <div className="editor-toolbar__group">
            {status}
            {actions}
          </div>
        </div>
      </div>
      <p className="editor-dock__caption">{caption}</p>
    </div>
  );
}

/** The status pill: the most urgent of unsaved, unpublished, published. */
export function StatusBadge({
  unsaved,
  unpublished,
}: {
  unsaved: boolean;
  unpublished: boolean;
}) {
  if (unsaved) return <Badge tone="warning">Unsaved</Badge>;
  if (unpublished) return <Badge tone="primary">Unpublished</Badge>;
  return <Badge tone="success">Published</Badge>;
}
