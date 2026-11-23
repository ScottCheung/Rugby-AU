'use client';

import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Button, Dialog, IconButton, useToast } from '@scottcheung/ui/client';
import {
  deleteEntryInPlaceAction,
  getEntryAction,
  saveEntryAction,
  setEntryStatusAction,
} from '@/app/manager/entryActions';
import {
  collections,
  type CollectionId,
  type Entry,
  type EntrySummary,
} from '@/lib/collections';
import { describeSchema } from '@/lib/forms/describe';
import { SchemaForm, type FieldErrors } from '../SchemaForm';

/**
 * An entry being edited in the panel: as last saved, and the fields as
 * they are now. Kept by the editor, so moving to another selection and
 * back keeps unsaved edits.
 */
export type EntryDraft = { saved: Entry; data: Record<string, unknown> };

export const entryKey = (collection: string, slug: string) =>
  `${collection}/${slug}`;

export const entryDirty = (draft: EntryDraft | undefined) =>
  !!draft && JSON.stringify(draft.data) !== JSON.stringify(draft.saved.data);

/**
 * One news article or player, edited in the right panel. Saving stores it,
 * and while it is published visitors see it straight away: an entry has
 * no separate draft, so the panel says so next to the button.
 */
export function EntryPanel({
  siteSlug,
  collection,
  slug,
  draft,
  onLoaded,
  onChange,
  onSaved,
  onDeleted,
}: {
  siteSlug: string;
  collection: CollectionId;
  slug: string;
  draft: EntryDraft | undefined;
  onLoaded: (entry: Entry) => void;
  onChange: (data: Record<string, unknown>) => void;
  /** Saved, published or unpublished: the preview reloads to show it. */
  onSaved: (entry: Entry, keepEdits: boolean) => void;
  onDeleted: () => void;
}) {
  const definition = collections[collection];
  const [missing, setMissing] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  // Load the entry's fields the first time it is opened.
  const loaded = !!draft;
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    getEntryAction(siteSlug, collection, slug).then((entry) => {
      if (cancelled) return;
      if (entry) onLoaded(entry);
      else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
    // onLoaded changes every render; loading once per entry is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, siteSlug, collection, slug]);

  if (missing)
    return (
      <p className="m-0 text-sm text-[var(--ui-muted)]">
        This {definition.itemLabel.toLowerCase()} no longer exists.
      </p>
    );
  if (!draft)
    return <p className="m-0 text-sm text-[var(--ui-muted)]">Loading…</p>;

  const { saved, data } = draft;
  const dirty = entryDirty(draft);
  const published = saved.status === 'published';

  const save = () =>
    start(async () => {
      const result = await saveEntryAction(siteSlug, collection, slug, data);
      if (result.ok) {
        setErrors({});
        onSaved(result.entry, false);
        toast({
          title: published ? 'Saved: live now' : 'Saved',
          tone: 'success',
        });
      } else {
        setErrors(result.errors);
        toast({ title: result.message, tone: 'danger' });
      }
    });

  const setStatus = (status: Entry['status']) =>
    start(async () => {
      if (dirty && status === 'published') {
        toast({ title: 'Save your changes first.', tone: 'danger' });
        return;
      }
      const next = await setEntryStatusAction(
        siteSlug,
        collection,
        slug,
        status,
      );
      if (!next) {
        toast({
          title: 'Not published: some fields need attention.',
          tone: 'danger',
        });
        return;
      }
      onSaved(next, true);
      toast({
        title: status === 'published' ? 'Published' : 'Unpublished',
        tone: 'success',
      });
    });

  return (
    <div className="flex flex-col gap-4">
      <p
        className={`m-0 rounded-xl px-3 py-2 text-[0.8125rem] ${
          published
            ? 'bg-[var(--ui-primary-soft)] text-[var(--ui-fg)]'
            : 'bg-[var(--ui-glass)] text-[var(--ui-muted)]'
        }`}
      >
        {published
          ? `Published. Saving updates the live site at once, on every page that shows this ${definition.itemLabel.toLowerCase()}.`
          : 'A draft: visitors do not see it until you publish it.'}
      </p>

      <SchemaForm
        fields={describeSchema(definition.schema)}
        value={data}
        onChange={onChange}
        errors={errors}
      />

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap items-center gap-2 border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
        <Button disabled={busy || !dirty} onClick={save}>
          {published ? 'Save and update live' : 'Save'}
        </Button>
        {published ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setStatus('draft')}
          >
            Unpublish
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus('published')}
          >
            Publish
          </Button>
        )}
        {published && definition.hasPage && (
          <a
            href={`/sites/${siteSlug}/${collection}/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="sc-ui-button"
            data-variant="ghost"
            title="View live"
          >
            <ExternalLink />
          </a>
        )}
        <IconButton
          variant="ghost"
          className="ml-auto"
          label={`Delete this ${definition.itemLabel.toLowerCase()}`}
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
        </IconButton>
      </div>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete this ${definition.itemLabel.toLowerCase()}?`}
        description="It disappears from every page that shows it. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() =>
              start(async () => {
                await deleteEntryInPlaceAction(siteSlug, collection, slug);
                setConfirmDelete(false);
                onDeleted();
                toast({ title: 'Deleted' });
              })
            }
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/**
 * A collection (News, Players) in the panel: its entries, newest saved
 * first, and a way to add one. Selecting one opens it here.
 */
export function CollectionPanel({
  collection,
  entries,
  dirtyKeys,
  busy,
  onOpen,
  onCreate,
}: {
  collection: CollectionId;
  entries: EntrySummary[];
  /** Entries with unsaved edits in the panel. */
  dirtyKeys: Set<string>;
  busy: boolean;
  onOpen: (slug: string) => void;
  onCreate: () => void;
}) {
  const definition = collections[collection];
  const list = entries.filter((entry) => entry.collection === collection);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="m-0 flex-1 text-sm text-[var(--ui-muted)]">
          {list.length === 0
            ? `No ${definition.label.toLowerCase()} yet.`
            : `${list.length} ${list.length === 1 ? definition.itemLabel.toLowerCase() : definition.label.toLowerCase()}. Blocks on any page can show them.`}
        </p>
        <Button size="sm" disabled={busy} onClick={onCreate}>
          <Plus /> New {definition.itemLabel.toLowerCase()}
        </Button>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((entry) => (
          <li key={entry.slug}>
            <button
              type="button"
              onClick={() => onOpen(entry.slug)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--ui-glass)]"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {entry.title}
                </span>
                {entry.detail && (
                  <span className="truncate text-xs text-[var(--ui-muted)]">
                    {entry.detail}
                  </span>
                )}
              </span>
              {dirtyKeys.has(entryKey(collection, entry.slug)) && (
                <span className="text-xs font-semibold text-[var(--ui-primary)]">
                  Unsaved
                </span>
              )}
              {entry.status === 'draft' && (
                <span className="rounded-full bg-[var(--ui-glass)] px-2 py-0.5 text-xs text-[var(--ui-muted)]">
                  Draft
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
