'use client';

import {
  ExternalLink,
  Expand,
  Monitor,
  Redo2,
  Shrink,
  Smartphone,
  Undo2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@scottcheung/ui';
import { IconButton, SegmentedControl, Select } from '@scottcheung/ui/client';

export type PreviewWidth = 'desktop' | 'mobile';

/**
 * The editor's one bar: where you are (site, page), how you look at it
 * (width, full screen), where the work stands (status) and what to do
 * with it (the `actions` slot: save, publish...).
 */
export function EditorTopBar({
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
  sites: { slug: string; name: string }[];
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
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
      {/* The ui Select fills its parent, so the wrappers set the widths. */}
      <div className="w-44">
        <Select
          aria-label="Site"
          value={siteSlug}
          onChange={(event) => onNavigate(`/manager/${event.target.value}`)}
        >
          {sites.map((site) => (
            <option key={site.slug} value={site.slug}>
              {site.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-56">
        <Select
          aria-label="Page"
          value={pageId}
          onChange={(event) =>
            onNavigate(`/manager/${siteSlug}/pages/${event.target.value}`)
          }
        >
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.path})
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-1">
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

      <SegmentedControl
        ariaLabel="Preview width"
        value={width}
        onValueChange={(value) => onWidthChange(value as PreviewWidth)}
        options={[
          { value: 'desktop', label: <Monitor aria-label="Desktop" /> },
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

      <div className="ml-auto flex items-center gap-2">
        {status}
        {actions}
      </div>
    </header>
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
  if (unsaved) return <Badge tone="warning">Unsaved changes</Badge>;
  if (unpublished) return <Badge tone="primary">Unpublished changes</Badge>;
  return <Badge tone="success">Published</Badge>;
}
