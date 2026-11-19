'use client';

import { z } from 'zod';
import {
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Textarea,
} from '@scottcheung/ui/client';
import { defaultValueFor, getMeta, humanize, unwrapSchema } from '@/lib/schema';

/** Validation messages for one component, keyed by prop path ("cards.0.heading"). */
export type FieldErrors = Record<string, string>;

type FieldProps = {
  schema: z.ZodType;
  /** Prop key, used as the label when the schema has no `title`. */
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  path: PropertyKey[];
  errors: FieldErrors;
};

export const pathKey = (path: PropertyKey[]) => path.map(String).join('.');

/**
 * Generates the editing form for a component from its Zod props schema.
 * Supports strings, numbers, booleans, enums, nested objects, lists and
 * optional values, so new components never need a hand-written form.
 */
export function SchemaForm({
  schema,
  value,
  onChange,
  errors,
}: {
  schema: z.ZodObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  errors: FieldErrors;
}) {
  return (
    <ObjectFields
      schema={schema}
      value={value}
      onChange={onChange}
      path={[]}
      errors={errors}
    />
  );
}

function ObjectFields({
  schema,
  value,
  onChange,
  path,
  errors,
}: {
  schema: z.ZodObject;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  path: PropertyKey[];
  errors: FieldErrors;
}) {
  const shape = schema.shape as Record<string, z.ZodType>;
  return (
    <div className="schema-fields">
      {Object.entries(shape).map(([key, field]) => (
        <SchemaField
          key={key}
          name={key}
          schema={field}
          value={value[key]}
          onChange={(next) => {
            const updated = { ...value, [key]: next };
            if (next === undefined) delete updated[key];
            onChange(updated);
          }}
          path={[...path, key]}
          errors={errors}
        />
      ))}
    </div>
  );
}

function SchemaField({ schema, name, value, onChange, path, errors }: FieldProps) {
  const meta = getMeta(schema);
  const { inner, optional } = unwrapSchema(schema);
  const label = meta.title ?? humanize(name);
  const error = errors[pathKey(path)];

  if (inner instanceof z.ZodObject) {
    if (optional && value === undefined)
      return (
        <div className="schema-optional">
          <span>
            {label} <small>Optional</small>
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange(defaultValueFor(inner))}
          >
            ＋ Add {label.toLowerCase()}
          </Button>
        </div>
      );
    return (
      <fieldset className="schema-group">
        <legend>
          {label}
          {optional && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
            >
              Remove {label.toLowerCase()}
            </Button>
          )}
        </legend>
        {meta.description && <p className="schema-hint">{meta.description}</p>}
        <ObjectFields
          schema={inner}
          value={(value ?? {}) as Record<string, unknown>}
          onChange={onChange}
          path={path}
          errors={errors}
        />
      </fieldset>
    );
  }

  if (inner instanceof z.ZodArray)
    return (
      <ListField
        schema={inner}
        label={label}
        itemLabel={meta.itemLabel ?? 'Item'}
        description={meta.description}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        path={path}
        errors={errors}
        error={error}
      />
    );

  if (inner instanceof z.ZodEnum) {
    const options = inner.options as string[];
    return (
      <Select
        label={label}
        hint={meta.description}
        error={error}
        value={String(value ?? options[0])}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {meta.optionLabels?.[option] ?? humanize(option)}
          </option>
        ))}
      </Select>
    );
  }

  if (inner instanceof z.ZodBoolean)
    return (
      <Switch
        label={label}
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
      />
    );

  if (inner instanceof z.ZodNumber)
    return (
      <Input
        type="number"
        label={label}
        hint={meta.description}
        error={error}
        value={typeof value === 'number' ? value : ''}
        onChange={(event) =>
          onChange(
            event.target.value === '' && optional
              ? undefined
              : Number(event.target.value),
          )
        }
      />
    );

  if (inner instanceof z.ZodString) {
    const Control = meta.widget === 'textarea' ? Textarea : Input;
    return (
      <Control
        label={optional ? `${label} (optional)` : label}
        hint={meta.description}
        placeholder={meta.placeholder}
        error={error}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) =>
          onChange(optional && event.target.value === '' ? undefined : event.target.value)
        }
      />
    );
  }

  return (
    <p className="schema-hint">
      “{label}” uses a field type the form generator does not support yet.
    </p>
  );
}

function ListField({
  schema,
  label,
  itemLabel,
  description,
  value,
  onChange,
  path,
  errors,
  error,
}: {
  schema: z.ZodArray;
  label: string;
  itemLabel: string;
  description?: string;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  path: PropertyKey[];
  errors: FieldErrors;
  error?: string;
}) {
  const element = schema.element as z.ZodType;
  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const replace = (index: number, next: unknown) =>
    onChange(value.map((current, i) => (i === index ? next : current)));
  return (
    <div className="schema-list">
      <div className="schema-list-heading">
        <span>
          {label} <b>{value.length}</b>
        </span>
      </div>
      {description && <p className="schema-hint">{description}</p>}
      {error && <p className="sc-ui-error">{error}</p>}
      {!value.length && (
        <p className="schema-empty">
          No {itemLabel.toLowerCase()}s yet. Add one to get started.
        </p>
      )}
      {value.map((item, index) => (
        <div className="schema-list-item" key={index}>
          <div className="schema-list-item-heading">
            <span>
              {itemLabel} {index + 1}
            </span>
            <span className="schema-list-item-actions">
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </IconButton>
              <IconButton
                type="button"
                variant="ghost"
                label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}
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
          {element instanceof z.ZodObject ? (
            // The item heading already names it, so skip the extra fieldset.
            <ObjectFields
              schema={element}
              value={(item ?? {}) as Record<string, unknown>}
              onChange={(next) => replace(index, next)}
              path={[...path, index]}
              errors={errors}
            />
          ) : (
            <SchemaField
              schema={element}
              name={itemLabel}
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
        onClick={() => onChange([...value, defaultValueFor(element)])}
      >
        ＋ Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
