'use client';

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, IconButton } from '@scottcheung/ui/client';
import type { Item } from '@/lib/components/blocks/roles';
import type { ItemRef } from '@/lib/components/items';
import { describeSchema } from '@/lib/forms/describe';
import { collections, type CollectionId } from '@/lib/collections';
import { sourceOf } from '@/lib/components/blocks/sources';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode } from '@/lib/types';
import { SchemaForm, type FieldErrors } from '../SchemaForm';
import {
  blockOf,
  drawnItems,
  itemsOf,
  propsOf,
  toggleHidden,
  withContent,
} from './blockEdit';

/**
 * One item of a block. Written here: that item's own fields (the block's
 * roles, labelled its way), with actions for it alone. From the site's
 * News or Players: that article's or player's own form, so it is edited
 * right here, everywhere it appears. From the fixtures service: read-only,
 * it can only be hidden in this block.
 */
export function ItemPanel({
  node,
  item: ref,
  data,
  errors,
  onProps,
  onSelectItem,
  renderEntry,
}: {
  node: ComponentNode;
  item: ItemRef;
  data: SiteData;
  errors: FieldErrors;
  /** `separate`: its own undo step (moves, hiding) rather than typing. */
  onProps: (props: Record<string, unknown>, separate?: boolean) => void;
  /** Select another item of the same block, or the block itself (null). */
  onSelectItem: (item: ItemRef | null) => void;
  /** An article's or a player's own form. */
  renderEntry: (collection: CollectionId, slug: string) => ReactNode;
}) {
  const block = blockOf(node);
  if (!block) return null;

  if ('ref' in ref) {
    const source = sourceOf(propsOf(node).content.from);
    const drawn = drawnItems(node, data).find(
      (one) => 'ref' in one.ref && one.ref.ref === ref.ref,
    );
    const hidden = drawn?.hidden ?? false;
    const hide = (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onProps(toggleHidden(node, ref), true)}
      >
        {hidden ? <Eye /> : <EyeOff />}
        {hidden ? 'Show here' : 'Hide here'}
      </Button>
    );
    // Records of a collection are edited right here, in their own form.
    if (source?.collection) {
      const collection = collections[source.collection];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--ui-glass)] py-1.5 pr-1.5 pl-3 text-[0.8125rem] text-[var(--ui-muted)]">
            <span className="flex-1">
              From the site&apos;s {collection.label}: edits show on every page
              with this {collection.itemLabel.toLowerCase()}.
            </span>
            {hide}
          </div>
          {renderEntry(source.collection, ref.ref)}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start gap-4">
        {source?.readOnlyNote && (
          <p className="m-0 text-sm text-[var(--ui-muted)]">
            {source.readOnlyNote}
          </p>
        )}
        {drawn?.item.title && (
          <p className="m-0 w-full rounded-xl bg-[var(--ui-glass)] p-3 font-semibold">
            {drawn.item.title}
          </p>
        )}
        {!source?.templateOnly && hide}
      </div>
    );
  }

  const list = itemsOf(node);
  const value = list[ref.index];
  if (!value)
    return (
      <p className="m-0 text-sm text-[var(--ui-muted)]">
        This item no longer exists.
      </p>
    );

  const name = block.itemLabel.toLowerCase();
  const setList = (next: Item[], separate: boolean) =>
    onProps(withContent(node, { items: next }), separate);
  const move = (to: number) => {
    const next = [...list];
    const [moved] = next.splice(ref.index, 1);
    next.splice(to, 0, moved);
    setList(next, true);
    onSelectItem({ field: 'items', index: to });
  };
  // Errors are keyed by prop path ("content.items.2.title"); the form
  // wants them relative to the item ("title").
  const prefix = `content.items.${ref.index}.`;
  const itemErrors: FieldErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, message]) => [key.slice(prefix.length), message]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <span className="flex-1 text-sm text-[var(--ui-muted)]">
          {block.itemLabel} {ref.index + 1} of {list.length}
        </span>
        <IconButton
          variant="ghost"
          label={value.hidden ? `Show this ${name}` : `Hide this ${name}`}
          onClick={() => onProps(toggleHidden(node, ref), true)}
        >
          {value.hidden ? <EyeOff /> : <Eye />}
        </IconButton>
        <IconButton
          variant="ghost"
          label={`Move ${name} earlier`}
          disabled={ref.index === 0}
          onClick={() => move(ref.index - 1)}
        >
          <ArrowUp />
        </IconButton>
        <IconButton
          variant="ghost"
          label={`Move ${name} later`}
          disabled={ref.index === list.length - 1}
          onClick={() => move(ref.index + 1)}
        >
          <ArrowDown />
        </IconButton>
        <IconButton
          variant="ghost"
          label={`Duplicate ${name}`}
          onClick={() => {
            const next = [...list];
            next.splice(ref.index + 1, 0, structuredClone(value));
            setList(next, true);
            onSelectItem({ field: 'items', index: ref.index + 1 });
          }}
        >
          <Copy />
        </IconButton>
        <IconButton
          variant="ghost"
          label={`Delete ${name}`}
          onClick={() => {
            setList(
              list.filter((_, index) => index !== ref.index),
              true,
            );
            onSelectItem(null);
          }}
        >
          <Trash2 />
        </IconButton>
      </div>
      {value.hidden && (
        <p className="m-0 rounded-lg bg-[var(--ui-glass)] px-3 py-2 text-sm text-[var(--ui-muted)]">
          Hidden: visitors do not see this {name}. It stays here so you can show
          it again.
        </p>
      )}
      <SchemaForm
        // Remount per item so open sections never carry over.
        key={`${node.id}:${ref.index}`}
        fields={describeSchema(block.itemSchema)}
        value={value as Record<string, unknown>}
        onChange={(next) =>
          setList(
            list.map((entry, index) =>
              index === ref.index ? (next as Item) : entry,
            ),
            false,
          )
        }
        errors={itemErrors}
      />
    </div>
  );
}
