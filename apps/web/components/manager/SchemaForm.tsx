'use client';

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Maximize2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Switch,
  Collapsible,
  Dialog,
  IconButton,
  Input,
  Textarea,
} from '@scottcheung/ui/client';
import {
  defaultValue,
  isShown,
  type EnumOption,
  type FieldDescriptor,
} from '@/lib/forms/describe';
import { summarizeProps } from '@/lib/forms/summarize';
import { ImagePreviewPicker } from './ImageField';
import { Sketch } from './Sketch';

/** Validation messages for one component, keyed by prop path ("cards.0.heading"). */
export type FieldErrors = Record<string, string>;

export const pathKey = (path: (string | number)[]) => path.join('.');

type Props = {
  fields: FieldDescriptor[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  errors?: FieldErrors;
};

/**
 * Draws the fields produced by describeSchema(). Knows nothing about
 * specific components, so a new component never needs new form code.
 */
export function SchemaForm({ fields, value, onChange, errors = {} }: Props) {
  return (
    <ObjectFields
      fields={fields}
      value={value}
      onChange={onChange}
      path={[]}
      errors={errors}
    />
  );
}

type FieldProps<Value> = {
  value: Value;
  onChange: (value: Value) => void;
  path: (string | number)[];
  errors: FieldErrors;
};

function ObjectFields({
  fields,
  value,
  onChange,
  path,
  errors,
}: FieldProps<Record<string, unknown>> & { fields: FieldDescriptor[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* A visibility flag is the item's eye toggle, not a field; managed
          fields are kept by the editor; some only apply to some values. */}
      {fields
        .filter((field) => isShown(field, value))
        .map((field) => (
          <Field
            key={field.key}
            field={field}
            value={value[field.key]}
            onChange={(next) => {
              const updated = { ...value, [field.key]: next };
              // Absent optional values are omitted from props, not stored as undefined.
              if (next === undefined) delete updated[field.key];
              onChange(updated);
            }}
            path={[...path, field.key]}
            errors={errors}
          />
        ))}
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
  path,
  errors,
}: FieldProps<unknown> & { field: FieldDescriptor }) {
  const error = errors[pathKey(path)];

  // An optional on/off option is simply off when absent: a switch, which
  // removes the value again when turned off. One that is on by default is
  // the other way round: absent is on, and off stores `false`.
  if (field.kind === 'boolean' && field.optional)
    return field.onByDefault ? (
      <SwitchRow
        label={field.label}
        hint={field.hint}
        checked={value !== false}
        onChange={(checked) => onChange(checked ? undefined : false)}
      />
    ) : (
      <SwitchRow
        label={field.label}
        hint={field.hint}
        checked={value === true}
        onChange={(checked) => onChange(checked ? true : undefined)}
      />
    );

  if (field.optional && value === undefined && field.kind !== 'enum') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--ui-glass)] px-3 py-2">
        <span className="text-sm font-semibold text-[var(--ui-fg)]">
          {field.label}{' '}
          <span className="font-normal text-[var(--ui-muted)]">(optional)</span>
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange(defaultValue(field))}
        >
          Add {field.label.toLowerCase()}
        </Button>
      </div>
    );
  }

  const removeButton = field.optional && (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="self-start"
      onClick={() => onChange(undefined)}
    >
      Remove {field.label.toLowerCase()}
    </Button>
  );

  switch (field.kind) {
    case 'object':
      return (
        // A soft tinted group rather than an outlined box. The legend floats
        // so it sits inside the tint instead of on its edge.
        <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-xl border-0 bg-[var(--ui-glass)] p-3">
          <legend className="float-left flex w-full items-center justify-between gap-2 p-0 text-sm font-semibold text-[var(--ui-fg)]">
            {field.label}
            {removeButton}
          </legend>
          {field.hint && (
            <p className="m-0 text-sm text-[var(--ui-muted)]">{field.hint}</p>
          )}
          {field.widget === 'image' && (
            <ImagePreviewPicker
              value={(value ?? {}) as Record<string, string>}
              onChange={(image) =>
                onChange({ ...(value as object | undefined), ...image })
              }
            />
          )}
          <ObjectFields
            fields={field.fields}
            value={(value ?? {}) as Record<string, unknown>}
            onChange={onChange}
            path={path}
            errors={errors}
          />
        </fieldset>
      );

    case 'union':
      return (
        <UnionField
          field={field}
          value={(value ?? {}) as Record<string, unknown>}
          onChange={onChange}
          path={path}
          errors={errors}
        />
      );

    case 'array':
      return (
        <ListField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          path={path}
          errors={errors}
          error={error}
        />
      );

    case 'enum':
      return (
        <OptionCards
          field={field}
          value={typeof value === 'string' ? value : undefined}
          onChange={onChange}
          error={error}
        />
      );

    case 'boolean':
      return (
        <div className="flex flex-col gap-1.5">
          <SwitchRow
            label={field.label}
            hint={field.hint}
            checked={value === true}
            onChange={onChange}
          />
          {removeButton}
        </div>
      );

    case 'number':
      return (
        <div className="flex flex-col gap-1.5">
          <Input
            type="number"
            label={field.label}
            hint={field.hint}
            error={error}
            value={typeof value === 'number' ? value : 0}
            onChange={(event) => onChange(event.target.valueAsNumber || 0)}
          />
          {removeButton}
        </div>
      );

    case 'textarea':
      return (
        <div className="flex flex-col gap-1.5">
          <LongTextField
            field={field}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            error={error}
          />
          {removeButton}
        </div>
      );

    case 'color': {
      const hex = typeof value === 'string' ? value : '';
      return (
        <div className="flex flex-col gap-1.5">
          <span className="sc-ui-field-label">{field.label}</span>
          <div className="relative">
            {/* The swatch is the picker: a circle at the start of the field. */}
            <input
              type="color"
              aria-label={`Pick ${field.label.toLowerCase()}`}
              value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000'}
              onChange={(event) => onChange(event.target.value)}
              className="absolute top-1/2 left-2 size-7 -translate-y-1/2 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
            />
            <Input
              aria-label={field.label}
              error={error}
              value={hex}
              placeholder="#1f6f43"
              onChange={(event) => onChange(event.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <Hint text={field.hint} />
          {removeButton}
        </div>
      );
    }

    case 'image': {
      const url = typeof value === 'string' ? value : '';
      return (
        <div className="flex flex-col gap-1.5">
          <span className="sc-ui-field-label">{field.label}</span>
          <div className="relative">
            {/* A thumbnail of the image at the start of the field. */}
            <span
              aria-hidden
              className="absolute top-1/2 left-2 grid size-7 -translate-y-1/2 place-items-center overflow-hidden rounded-md bg-[var(--ui-surface)] p-0.5 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="size-full object-contain" />
              ) : (
                <ImageIcon className="size-3.5 text-[var(--ui-faint)]" />
              )}
            </span>
            <Input
              aria-label={field.label}
              error={error}
              value={url}
              placeholder={field.placeholder ?? 'https://… or /images/…'}
              onChange={(event) => onChange(event.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          {url && (
            // Large enough to check the image: a wide logo, a tiny icon.
            <span className="flex h-16 items-center justify-center rounded-xl bg-[var(--ui-glass)] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${field.label} preview`}
                className="max-h-full max-w-full object-contain"
              />
            </span>
          )}
          <Hint text={field.hint} />
          {removeButton}
        </div>
      );
    }

    case 'text':
    case 'url':
    case 'date': {
      const Control = Input;
      return (
        <div className="flex flex-col gap-1.5">
          <Control
            type={
              field.kind === 'url' || field.kind === 'date'
                ? field.kind
                : undefined
            }
            label={field.label}
            hint={field.hint}
            placeholder={field.placeholder}
            error={error}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
          />
          {removeButton}
        </div>
      );
    }

    default:
      return (
        <p className="text-sm text-amber-700">
          “{field.label}” uses a field type the form generator does not support
          yet.
        </p>
      );
  }
}

/**
 * One of several shapes: a picker for the shape, then that shape's own
 * fields. Switching keeps the values both shapes share.
 */
function UnionField({
  field,
  value,
  onChange,
  path,
  errors,
}: FieldProps<Record<string, unknown>> & {
  field: Extract<FieldDescriptor, { kind: 'union' }>;
}) {
  const current = String(
    value[field.discriminator] ?? field.options[0]?.value ?? '',
  );
  const option =
    field.options.find((candidate) => candidate.value === current) ??
    field.options[0];
  const choose = (next: string) => {
    if (next === current) return;
    const target = field.options.find((candidate) => candidate.value === next);
    if (!target) return;
    const fresh = defaultValue({
      ...field,
      kind: 'object',
      fields: target.fields,
    }) as Record<string, unknown>;
    const kept = Object.fromEntries(
      target.fields
        .filter((child) => value[child.key] !== undefined)
        .map((child) => [child.key, value[child.key]]),
    );
    onChange({ [field.discriminator]: next, ...fresh, ...kept });
  };
  const picker: Extract<FieldDescriptor, { kind: 'enum' }> = {
    key: `${path.join('.')}.${field.discriminator}`,
    label: field.label,
    hint: field.hint,
    optional: false,
    group: field.group,
    kind: 'enum',
    options: field.options,
  };
  return (
    <div className="flex flex-col gap-4">
      {field.options.length > 1 && (
        <Field
          field={picker}
          value={current}
          onChange={(next) => choose(String(next))}
          path={[...path, field.discriminator]}
          errors={errors}
        />
      )}
      {option && (
        <ObjectFields
          fields={option.fields}
          value={value}
          onChange={onChange}
          path={path}
          errors={errors}
        />
      )}
    </div>
  );
}

function ListField({
  field,
  value,
  onChange,
  path,
  errors,
  error,
}: FieldProps<unknown[]> & {
  field: Extract<FieldDescriptor, { kind: 'array' }>;
  error?: string;
}) {
  const itemName = field.itemLabel.toLowerCase();
  // Which items are expanded, by position. Kept in step with moves below.
  const [open, setOpen] = useState<boolean[]>(() => value.map(() => false));
  const isOpen = (index: number) => open[index] ?? false;
  const setOpenAt = (index: number, next: boolean) =>
    setOpen((current) => {
      const copy = value.map((_, i) => current[i] ?? false);
      copy[index] = next;
      return copy;
    });

  const replace = (index: number, next: unknown) =>
    onChange(value.map((item, i) => (i === index ? next : item)));
  const move = (from: number, to: number) => {
    const reorder = <T,>(list: T[]) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    };
    onChange(reorder(value));
    setOpen((current) => reorder(value.map((_, i) => current[i] ?? false)));
  };
  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setOpen((current) => current.filter((_, i) => i !== index));
  };
  const add = (start: unknown = defaultValue(field.item)) => {
    onChange([...value, start]);
    // A new item opens straight away, ready to fill in.
    setOpen((current) => [...value.map((_, i) => current[i] ?? false), true]);
  };
  // Items with a `hidden` flag get an eye toggle (see lib/components/fields.ts).
  const canHide =
    field.item.kind === 'object' &&
    field.item.fields.some((child) => child.visibility);
  const toggleHidden = (index: number) => {
    const item = { ...(value[index] as Record<string, unknown>) };
    if (item.hidden) delete item.hidden;
    else item.hidden = true;
    replace(index, item);
  };
  const isHidden = (item: unknown) =>
    !!item && typeof item === 'object' && 'hidden' in item && !!item.hidden;
  const itemHasError = (index: number) => {
    const prefix = pathKey([...path, index]);
    return Object.keys(errors).some(
      (key) => key === prefix || key.startsWith(`${prefix}.`),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="sc-ui-field-label m-0">
          {field.label} ({value.length})
        </p>
        {field.hint && <p className="sc-ui-field-hint m-0">{field.hint}</p>}
        {error && <p className="sc-ui-error m-0">{error}</p>}
      </div>

      {value.length === 0 && (
        <p className="m-0 rounded-lg bg-[var(--ui-glass)] px-3 py-4 text-center text-sm text-[var(--ui-muted)]">
          No {itemName}s yet. Add one to get started.
        </p>
      )}

      {value.map((item, index) => (
        <Collapsible
          key={index}
          open={isOpen(index)}
          onOpenChange={(next) => setOpenAt(index, next)}
          invalid={itemHasError(index)}
          summary={
            isHidden(item) ? (
              <span className="text-[var(--ui-muted)] line-through">
                {itemSummary(field, item, index)}
              </span>
            ) : (
              itemSummary(field, item, index)
            )
          }
          actions={
            <>
              {canHide && (
                <IconButton
                  type="button"
                  variant="ghost"
                  label={
                    isHidden(item)
                      ? `Show ${itemName} ${index + 1}`
                      : `Hide ${itemName} ${index + 1}`
                  }
                  onClick={() => toggleHidden(index)}
                >
                  {isHidden(item) ? <EyeOff /> : <Eye />}
                </IconButton>
              )}
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemName} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp />
              </IconButton>
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemName} ${index + 1} down`}
                disabled={index === value.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown />
              </IconButton>
              <IconButton
                type="button"
                variant="ghost"
                label={`Remove ${itemName} ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </IconButton>
            </>
          }
        >
          {field.item.kind === 'object' ? (
            // The summary row already names the item, so skip the extra fieldset.
            <ObjectFields
              fields={field.item.fields}
              value={(item ?? {}) as Record<string, unknown>}
              onChange={(next) => replace(index, next)}
              path={[...path, index]}
              errors={errors}
            />
          ) : (
            <Field
              field={field.item}
              value={item}
              onChange={(next) => replace(index, next)}
              path={[...path, index]}
              errors={errors}
            />
          )}
        </Collapsible>
      ))}

      {field.item.kind === 'union' ? (
        // A list of mixed kinds (a story's pieces): one button per kind.
        <div className="flex flex-wrap gap-2">
          {field.item.options.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => add(unionDefault(field.item, option.value))}
            >
              <Plus /> {option.label}
            </Button>
          ))}
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => add()}
        >
          <Plus /> Add {itemName}
        </Button>
      )}
    </div>
  );
}

/** A new item of one shape of a union: that shape's tag and its defaults. */
function unionDefault(field: FieldDescriptor, tag: string): unknown {
  if (field.kind !== 'union') return defaultValue(field);
  const option = field.options.find((candidate) => candidate.value === tag);
  if (!option) return defaultValue(field);
  return {
    [field.discriminator]: tag,
    ...(defaultValue({
      ...field,
      kind: 'object',
      fields: option.fields,
    }) as object),
  };
}

/** One line for a collapsed list item: its main text, or "Card 3". */
function itemSummary(
  field: Extract<FieldDescriptor, { kind: 'array' }>,
  item: unknown,
  index: number,
): string {
  const fallback = `${field.itemLabel} ${index + 1}`;
  // "3. Picture · A packed stadium": the kind, then what it says.
  if (field.item.kind === 'union' && item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const union = field.item;
    const option = union.options.find(
      (candidate) => candidate.value === record[union.discriminator],
    );
    if (option) {
      const summary = summarizeProps(option.fields, record);
      return `${index + 1}. ${option.label}${summary ? ` · ${summary}` : ''}`;
    }
  }
  if (field.item.kind === 'object' && item && typeof item === 'object') {
    const summary = summarizeProps(
      field.item.fields,
      item as Record<string, unknown>,
    );
    return summary ? `${index + 1}. ${summary}` : fallback;
  }
  return typeof item === 'string' && item ? `${index + 1}. ${item}` : fallback;
}

/**
 * An on/off option as a settings row: the label (and its hint) on the
 * left, a switch on the right. The whole row is the click target.
 */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-[var(--ui-glass)] px-3 py-2.5 transition-colors hover:bg-[color-mix(in_oklch,var(--ui-primary),transparent_91%)]">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.8125rem] leading-tight font-semibold text-[var(--ui-fg)]">
          {label}
        </span>
        {hint && (
          <span className="text-xs leading-snug text-[var(--ui-muted)]">
            {hint}
          </span>
        )}
      </span>
      <Switch
        className="shrink-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

/** A field's help text: quiet, under the control. */
function Hint({ text }: { text?: string }) {
  return text ? (
    <span className="text-xs leading-snug text-[var(--ui-muted)]">{text}</span>
  ) : null;
}

/**
 * An enum as cards, one per option: a picture (`optionSketches`) or a type
 * sample (`optionSamples`), the label and a short line. An optional enum
 * starts with a "not set" card. A radio group: arrow keys move the choice,
 * like native radio buttons.
 */
function OptionCards({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<FieldDescriptor, { kind: 'enum' }>;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
}) {
  // An absent value either means one of the options (`emptyIs`: the
  // original look, picked until another is chosen) or gets a card of its own.
  const options: (EnumOption | { value: undefined; label: string })[] = [
    ...(field.optional && !field.emptyIs
      ? [{ value: undefined, label: field.emptyLabel ?? 'Not set' }]
      : []),
    ...field.options,
  ];
  const current = value ?? field.emptyIs;
  // The card picked here (not the one chosen on load): its picture plays
  // its entrance once (data-picked, app/manager/manager.css).
  const [picked, setPicked] = useState<string | undefined>();
  const choose = (next: string | undefined) => {
    setPicked(next ?? field.emptyIs);
    onChange(next !== undefined && next === field.emptyIs ? undefined : next);
  };
  const pictured = field.options.some((option) => option.sketch);
  const rich = field.options.some(
    (option) => option.description || option.sample,
  );
  const id = `options-${field.key}`;
  const move = (from: number, step: number) => {
    const next = options[(from + step + options.length) % options.length];
    choose(next.value);
    document
      .querySelector<HTMLButtonElement>(
        `[data-option-field="${field.key}"][data-index="${options.indexOf(next)}"]`,
      )
      ?.focus();
  };
  // Cards with a line of text sit two in a row, so the text has room;
  // pictures three (or all, up to four). Plain labels are chips as wide
  // as their words, wrapping to as many rows as the panel's width needs.
  const chips = !rich && !pictured;
  const columns = rich ? 2 : options.length <= 4 ? options.length : 3;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="sc-ui-field-label" id={id}>
        {field.label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={chips ? 'flex flex-wrap gap-2' : 'grid gap-2'}
        style={
          chips
            ? undefined
            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
        }
      >
        {options.map((option, index) => {
          const selected = option.value === current;
          const full = option as EnumOption;
          return (
            <button
              key={option.value ?? '(none)'}
              type="button"
              role="radio"
              aria-checked={selected}
              data-option-field={field.key}
              data-index={index}
              data-picked={
                (selected && picked !== undefined && picked === current) ||
                undefined
              }
              tabIndex={
                selected || (current === undefined && index === 0) ? 0 : -1
              }
              onClick={() => choose(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  move(index, 1);
                } else if (
                  event.key === 'ArrowLeft' ||
                  event.key === 'ArrowUp'
                ) {
                  event.preventDefault();
                  move(index, -1);
                }
              }}
              // No borders: a faint tint at rest that deepens on hover; the
              // chosen one is filled like a primary button. Pictures read
              // `--sketch-ink` for the marks drawn on a filled shape.
              className={`flex min-w-0 flex-col gap-1.5 text-left transition-colors ${
                chips
                  ? 'items-center justify-center rounded-full px-3.5 py-1.5 whitespace-nowrap'
                  : 'rounded-xl p-2'
              } ${
                selected
                  ? 'text-[var(--ui-on-primary)] [--sketch-ink:var(--ui-primary)] [background:var(--ui-primary-gradient)]'
                  : 'bg-[var(--ui-glass)] text-[var(--ui-muted)] [--sketch-ink:white] hover:bg-[color-mix(in_oklch,var(--ui-primary),transparent_90%)] hover:text-[var(--ui-fg)]'
              }`}
            >
              {pictured && (
                // One layer: the card itself is the frame and the picture
                // sits straight on it, in the card's text colour.
                <span className="mx-auto block w-full max-w-[3.25rem] pt-1">
                  {full.sketch ? (
                    <Sketch name={full.sketch} />
                  ) : (
                    // "Not set": an empty frame, the same size.
                    <svg
                      viewBox="0 0 60 40"
                      aria-hidden
                      className="block w-full"
                    >
                      <rect
                        x={2}
                        y={2}
                        width={56}
                        height={36}
                        rx={4}
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        opacity={0.4}
                      />
                    </svg>
                  )}
                </span>
              )}
              {full.sample && (
                <span
                  aria-hidden
                  className={`grid h-12 place-items-center text-2xl font-bold ${selected ? 'bg-white/15' : 'bg-[var(--ui-surface)] text-[var(--ui-fg)]'}`}
                  style={{
                    fontFamily: full.sample.font,
                    textTransform: full.sample.uppercase ? 'uppercase' : 'none',
                    borderRadius: full.sample.radius ?? '0.5rem',
                  }}
                >
                  Aa
                </span>
              )}
              <span
                className={`text-[0.8125rem] leading-tight font-semibold ${rich ? '' : 'text-center'}`}
              >
                {option.label}
              </span>
              {full.description && (
                <span
                  className={`text-xs leading-snug ${selected ? 'opacity-85' : 'text-[var(--ui-muted)]'}`}
                >
                  {full.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Hint text={field.hint} />
      {error && <span className="sc-ui-error">{error}</span>}
    </div>
  );
}

/** A text box that grows with its content, between these heights. */
const growing = {
  fieldSizing: 'content',
  minHeight: '7.5rem',
  maxHeight: '60vh',
  resize: 'vertical',
} as const;

/**
 * Multi-line text: the box grows as you type, and "Expand" opens a large
 * editor for long copy such as an article. Edits apply as you type in
 * either place, so the canvas behind the dialog stays up to date.
 */
function LongTextField({
  field,
  value,
  onChange,
  error,
}: {
  field: { label: string; hint?: string; placeholder?: string };
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-end justify-between gap-2">
        <span className="sc-ui-field-label">{field.label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--ui-primary)] hover:bg-[var(--ui-glass)]"
        >
          <Maximize2 className="size-3" aria-hidden />
          Expand
        </button>
      </div>
      <Textarea
        aria-label={field.label}
        hint={field.hint}
        placeholder={field.placeholder}
        error={error}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={growing}
      />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={field.label}
        description={field.hint}
        style={{ width: 'min(56rem, 100%)', maxHeight: '90dvh' }}
      >
        <div className="flex flex-col gap-3">
          <Textarea
            aria-label={field.label}
            autoFocus
            value={value}
            error={error}
            onChange={(event) => onChange(event.target.value)}
            style={{ minHeight: '60vh', resize: 'vertical', fontSize: '1rem' }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--ui-muted)]">
              {value.trim() ? value.trim().split(/\s+/).length : 0} words ·
              changes apply as you type
            </span>
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
