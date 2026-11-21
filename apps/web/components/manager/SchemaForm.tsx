'use client';

import { Maximize2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from '@scottcheung/ui/client';
import { defaultValue, type FieldDescriptor } from '@/lib/forms/describe';
import { ImagePreviewPicker } from './ImageField';
import { hasSketch, Sketch } from './Sketch';

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
      {fields.map((field) => (
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

  if (field.optional && value === undefined) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2">
        <span className="text-sm font-semibold text-slate-700">
          {field.label}{' '}
          <span className="font-normal text-slate-500">(optional)</span>
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
      onClick={() => onChange(undefined)}
    >
      Remove {field.label.toLowerCase()}
    </Button>
  );

  switch (field.kind) {
    case 'object':
      return (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-800">
            {field.label}
            {removeButton}
          </legend>
          {field.hint && <p className="text-sm text-slate-500">{field.hint}</p>}
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
      // Options with pictures (optionSketches in the schema) are picked visually.
      if (field.options.every((option) => hasSketch(option.sketch)))
        return (
          <SketchPicker
            field={field}
            value={String(value ?? '')}
            onChange={onChange}
            error={error}
          />
        );
      // A few options read better as a segmented control than a dropdown.
      if (field.options.length <= 3)
        return (
          <div className="flex flex-col gap-1 justify-center items-center.5">
            <span className="sc-ui-field-label">{field.label}</span>
            <SegmentedControl
              ariaLabel={field.label}
              className="w-full [&>button]:flex-1 [&>button]:justify-center"
              value={String(value ?? '')}
              options={field.options}
              onValueChange={onChange}
            />
            {field.hint && (
              <span className="sc-ui-field-hint">{field.hint}</span>
            )}
            {error && <span className="sc-ui-error">{error}</span>}
            {removeButton}
          </div>
        );
      return (
        <div className="flex flex-col gap-1 justify-center items-center">
          <Select
            label={field.label}
            hint={field.hint}
            error={error}
            value={String(value ?? '')}
            onChange={(event) => onChange(event.target.value)}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {removeButton}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            label={field.label}
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          {removeButton}
        </div>
      );

    case 'number':
      return (
        <div className="flex flex-col gap-1 justify-center items-center">
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
        <div className="flex flex-col gap-1 justify-center items-center">
          <LongTextField
            field={field}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            error={error}
          />
          {removeButton}
        </div>
      );

    case 'text':
    case 'url':
    case 'date': {
      const Control = Input;
      return (
        <div className="flex flex-col gap-1 justify-center items-center">
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
  const replace = (index: number, next: unknown) =>
    onChange(value.map((item, i) => (i === index ? next : item)));
  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {field.label}{' '}
          <span className="font-normal text-slate-500">({value.length})</span>
        </p>
        {field.hint && <p className="text-sm text-slate-500">{field.hint}</p>}
        {error && <p className="sc-ui-error">{error}</p>}
      </div>

      {value.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          No {itemName}s yet. Add one to get started.
        </p>
      )}

      {value.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              {field.itemLabel} {index + 1}
            </span>
            <span className="flex items-center gap-1">
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemName} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </IconButton>
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemName} ${index + 1} down`}
                disabled={index === value.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </IconButton>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </span>
          </div>
          {field.item.kind === 'object' ? (
            // The item heading already names it, so skip the extra fieldset.
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
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, defaultValue(field.item)])}
      >
        + Add {itemName}
      </Button>
    </div>
  );
}

/**
 * An enum shown as small skeleton pictures, one per option. A radio group:
 * arrow keys move the choice, like native radio buttons.
 */
function SketchPicker({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<FieldDescriptor, { kind: 'enum' }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const options = field.options;
  const move = (from: number, step: number) => {
    const next = options[(from + step + options.length) % options.length];
    onChange(next.value);
    // Keep focus on the newly chosen option.
    document
      .querySelector<HTMLButtonElement>(
        `[data-sketch-field="${field.key}"][data-value="${next.value}"]`,
      )
      ?.focus();
  };

  return (
    <div className="flex flex-col gap-1 justify-center items-center.5">
      <span className="sc-ui-field-label" id={`sketch-${field.key}`}>
        {field.label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`sketch-${field.key}`}
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${options.length > 4 ? 3 : options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-sketch-field={field.key}
              data-value={option.value}
              // Only the chosen option is in the tab order (radio-group pattern).
              tabIndex={selected || (!value && index === 0) ? 0 : -1}
              onClick={() => onChange(option.value)}
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
              className={`flex flex-col items-stretch gap-1 rounded-xl border p-1.5 text-xs font-semibold transition ${selected
                ? 'border-[var(--ui-primary)] bg-[color-mix(in_oklch,var(--ui-primary),transparent_90%)] text-[var(--ui-primary)]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
            >
              <span className="block rounded-md bg-slate-50 px-1 py-0.5">
                <Sketch name={option.sketch!} />
              </span>
              <span className="text-center leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
      {field.hint && <span className="sc-ui-field-hint">{field.hint}</span>}
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
