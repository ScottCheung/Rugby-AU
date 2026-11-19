'use client';

import {
  Button,
  Checkbox,
  IconButton,
  Input,
  Select,
  Textarea,
} from '@scottcheung/ui/client';
import { defaultValue, type FieldDescriptor } from '@/lib/forms/describe';

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
      return (
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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

    case 'text':
    case 'url':
    case 'textarea': {
      const Control = field.kind === 'textarea' ? Textarea : Input;
      return (
        <div className="flex flex-col gap-1">
          <Control
            type={field.kind === 'url' ? 'url' : undefined}
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
