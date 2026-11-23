'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { Button, IconButton, Select } from '@scottcheung/ui/client';
import type { BlockDefinition } from '@/lib/components/blocks/defineBlock';
import { missingRoles } from '@/lib/components/blocks/roles';
import { sourceOf } from '@/lib/components/blocks/sources';
import type { ItemRef } from '@/lib/components/items';
import { blockDefinitions } from '@/lib/components/registry';
import { describeField, describeSchema } from '@/lib/forms/describe';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode } from '@/lib/types';
import { SchemaForm, type FieldErrors } from '../SchemaForm';
import { Sketch } from '../Sketch';
import {
  drawnItems,
  itemNoun,
  itemsOf,
  propsOf,
  toggleHidden,
  withContent,
} from './blockEdit';

export type Part = 'content' | 'layout' | 'style';

/**
 * A block, one tab at a time. Each tab edits one of its props, with the
 * form generated from that prop's schema:
 *
 *   content  where the items come from, its options, and the items
 *   layout   grid or carousel, and that arrangement's options
 *   style    what one item looks like: the block type, and its options
 */
export function BlockPanel({
  node,
  block,
  part,
  data,
  isTemplate,
  errors,
  onProps,
  onChangeType,
  onSelectItem,
}: {
  node: ComponentNode;
  block: BlockDefinition;
  part: Part;
  /** On the news template, items can come from the article being shown. */
  isTemplate: boolean;
  data: SiteData;
  errors: FieldErrors;
  onProps: (props: Record<string, unknown>, separate?: boolean) => void;
  /** Draw the same items as another block type. */
  onChangeType: (type: string, props: Record<string, unknown>) => void;
  onSelectItem: (item: ItemRef) => void;
}) {
  const props = propsOf(node);
  const described = describeField(part, block.schema.shape[part]);
  // A template-only source ("This article") means nothing on other pages.
  const field =
    described.kind === 'union' && !isTemplate
      ? {
          ...described,
          options: described.options.filter(
            (option) =>
              !sourceOf(option.value)?.templateOnly ||
              option.value === props.content.from,
          ),
        }
      : described;
  // A union (content, layout) draws its own picker; an object (style)
  // is the whole tab, so its fields are drawn without a frame around them.
  const prefix = `${part}.`;
  const partErrors: FieldErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, message]) => [key.slice(prefix.length), message]),
  );
  const form =
    field.kind === 'object' ? (
      <SchemaForm
        key={`${node.id}:${part}`}
        fields={field.fields}
        value={(node.props[part] ?? {}) as Record<string, unknown>}
        onChange={(next) => onProps({ ...node.props, [part]: next })}
        errors={partErrors}
      />
    ) : (
      <SchemaForm
        key={`${node.id}:${part}`}
        fields={[field]}
        value={node.props}
        onChange={(next) =>
          // Switching where the items come from is its own undo step.
          onProps(
            next,
            part === 'content' &&
              (next.content as { from?: string }).from !== props.content.from,
          )
        }
        errors={errors}
      />
    );

  if (part === 'layout') return form;
  if (part === 'style')
    return (
      <div className="flex flex-col gap-5">
        <TypePicker node={node} block={block} onChangeType={onChangeType} />
        {describeSchema(block.style).length > 0 && form}
      </div>
    );
  return (
    <div className="flex flex-col gap-5">
      {form}
      <ItemsList
        node={node}
        block={block}
        data={data}
        onProps={onProps}
        onSelectItem={onSelectItem}
      />
    </div>
  );
}

/**
 * "Each item looks like": the block types that can draw these items. The
 * items stay; a type that needs a field they lack says so, and shows a
 * placeholder until it is filled in.
 */
function TypePicker({
  node,
  block,
  onChangeType,
}: {
  node: ComponentNode;
  block: BlockDefinition;
  onChangeType: (type: string, props: Record<string, unknown>) => void;
}) {
  const { content } = propsOf(node);
  const items = content.from === 'items' ? itemsOf(node) : [];
  const options = (blockDefinitions as readonly BlockDefinition[]).filter(
    (candidate) =>
      content.from === 'items'
        ? candidate.writable
        : candidate.sources.includes(content.from as never),
  );
  if (options.length < 2) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="sc-ui-field-label">Each item looks like</span>
      <div role="radiogroup" className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const selected = option.type === block.type;
          const missing = [
            ...new Set(
              items.flatMap((item) =>
                missingRoles(item, option.roles).map(
                  (role) => option.roles[role]!.label,
                ),
              ),
            ),
          ];
          return (
            <button
              key={option.type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() =>
                !selected &&
                onChangeType(option.type, {
                  content,
                  layout: node.props.layout,
                  style: structuredClone(option.defaultProps.style),
                })
              }
              // No border or shadow: a tint, deeper when chosen.
              className={`flex flex-col items-stretch gap-0.5 rounded-lg p-1 text-[10px] font-semibold transition-colors ${
                selected
                  ? 'bg-[color-mix(in_oklch,var(--ui-primary),transparent_88%)] text-[var(--ui-primary)]'
                  : 'bg-slate-100/70 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span className="block rounded-md bg-slate-50 px-1 py-0.5">
                <span className="mx-auto block max-w-[2.5rem]">
                  <Sketch name={option.sketch} />
                </span>
              </span>
              <span className="text-center leading-tight">
                {option.label}
                {missing.length > 0 && (
                  <span className="block text-[9px] font-normal opacity-70">
                    needs {missing.join(', ').toLowerCase()}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The items, one row each; a row opens that item (in the Layers tree too).
 * Written here: add, hide, move and delete them. From a data source: the
 * ones it shows now; the eye hides one in this block only, and when they
 * are chosen by hand, they can be added and taken out here.
 */
function ItemsList({
  node,
  block,
  data,
  onProps,
  onSelectItem,
}: {
  node: ComponentNode;
  block: BlockDefinition;
  data: SiteData;
  onProps: (props: Record<string, unknown>, separate?: boolean) => void;
  onSelectItem: (item: ItemRef) => void;
}) {
  const { content } = propsOf(node);
  const written = content.from === 'items';
  const rows = drawnItems(node, data);
  const noun = itemNoun(node);
  const items = itemsOf(node);
  const picking = content.mode === 'pick';
  const picked = (content.picked as string[] | undefined) ?? [];
  const pool = sourceOf(content.from)?.pool?.(data) ?? [];
  const setItems = (next: typeof items) =>
    onProps(withContent(node, { items: next }), true);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="sc-ui-overline m-0">
        {written ? block.itemsLabel : `Showing now · ${rows.length}`}
      </h3>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((row, position) => (
          <li
            key={row.key}
            className="flex items-center gap-1 rounded-xl border border-[var(--ui-border)] py-0.5 pr-1 pl-1"
          >
            <button
              type="button"
              onClick={() => onSelectItem(row.ref)}
              className={`min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm ${row.hidden ? 'text-[var(--ui-muted)] line-through' : ''}`}
            >
              {row.item.title ||
                row.item.value ||
                `${block.itemLabel} ${position + 1}`}
            </button>
            <IconButton
              variant="ghost"
              label={row.hidden ? `Show this ${noun}` : `Hide this ${noun}`}
              onClick={() => onProps(toggleHidden(node, row.ref), true)}
            >
              {row.hidden ? <EyeOff /> : <Eye />}
            </IconButton>
            {written && (
              <>
                <IconButton
                  variant="ghost"
                  label="Move earlier"
                  disabled={position === 0}
                  onClick={() => move(position, position - 1)}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  variant="ghost"
                  label="Move later"
                  disabled={position === rows.length - 1}
                  onClick={() => move(position, position + 1)}
                >
                  <ArrowDown />
                </IconButton>
                <IconButton
                  variant="ghost"
                  label={`Delete this ${noun}`}
                  onClick={() =>
                    setItems(items.filter((_, index) => index !== position))
                  }
                >
                  <Trash2 />
                </IconButton>
              </>
            )}
            {picking && 'ref' in row.ref && (
              <IconButton
                variant="ghost"
                label={`Take this ${noun} out`}
                onClick={() =>
                  onProps(
                    withContent(node, {
                      picked: picked.filter(
                        (id) => 'ref' in row.ref && id !== row.ref.ref,
                      ),
                    }),
                    true,
                  )
                }
              >
                <X />
              </IconButton>
            )}
          </li>
        ))}
      </ul>
      {rows.length === 0 && !written && (
        <p className="m-0 text-sm text-[var(--ui-muted)]">
          {picking
            ? `Choose the ${noun}s to show below.`
            : `Nothing to show with these options.`}
        </p>
      )}
      {written && (
        <div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setItems([...items, {}]);
              onSelectItem({ field: 'items', index: items.length });
            }}
          >
            <Plus /> Add {noun}
          </Button>
        </div>
      )}
      {picking && (
        <Select
          label={`Add ${noun === 'article' ? 'an' : 'a'} ${noun}`}
          value=""
          onChange={(event) =>
            event.target.value &&
            onProps(
              withContent(node, { picked: [...picked, event.target.value] }),
              true,
            )
          }
        >
          <option value="">Choose…</option>
          {pool
            .filter((one) => !picked.includes(one.id))
            .map((one) => (
              <option key={one.id} value={one.id}>
                {one.label}
              </option>
            ))}
        </Select>
      )}
    </section>
  );
}
