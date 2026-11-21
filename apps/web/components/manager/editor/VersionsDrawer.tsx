'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@scottcheung/ui';
import { Button, Drawer } from '@scottcheung/ui/client';
import { listVersionsAction } from '@/app/manager/actions';
import {
  KEEP_LATEST_VERSIONS,
  KEEP_RECENT_DAYS,
} from '@/lib/versions/retention';

type VersionSummary = { version: number; title: string; publishedAt: string };

/**
 * The page's published versions, newest first. "View" shows one in the
 * preview (read-only); "Restore to draft" copies it into the draft, to be
 * published as usual.
 */
export function VersionsDrawer({
  open,
  onClose,
  pageId,
  currentVersion,
  viewingVersion,
  canRestore,
  onView,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  /** The version visitors see now. */
  currentVersion?: number;
  viewingVersion?: number;
  /** False while there are unsaved changes: restoring would overwrite them. */
  canRestore: boolean;
  onView: (version: number) => void;
  onRestore: (version: number) => void;
}) {
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);

  // Load the list each time the drawer opens (a publish may have added one).
  useEffect(() => {
    if (!open) return;
    let current = true;
    listVersionsAction(pageId).then((found) => {
      if (current) setVersions(found);
    });
    return () => {
      current = false;
    };
  }, [open, pageId]);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Version history"
      description={`Each publish is kept as a version: the latest ${KEEP_LATEST_VERSIONS}, plus all from the last ${KEEP_RECENT_DAYS} days.`}
    >
      {!canRestore && (
        <p className="m-0 mb-3 text-sm text-[var(--ui-warning)]">
          Save or discard your changes before restoring a version.
        </p>
      )}
      {versions === null ? (
        <p className="m-0 text-sm text-[var(--ui-muted)]">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="m-0 text-sm text-[var(--ui-muted)]">
          This page has not been published yet.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {versions.map((entry) => (
            <li
              key={entry.version}
              className="flex flex-col gap-2 rounded-2xl bg-[var(--ui-glass)] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Version {entry.version}</span>
                {entry.version === currentVersion && (
                  <Badge tone="success">Live</Badge>
                )}
                {entry.version === viewingVersion && (
                  <Badge tone="primary">Viewing</Badge>
                )}
              </div>
              <span className="text-xs text-[var(--ui-muted)]">
                {entry.title} · published{' '}
                {new Date(entry.publishedAt).toLocaleString('en-AU', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onView(entry.version)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canRestore}
                  onClick={() => onRestore(entry.version)}
                >
                  Restore to draft
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
