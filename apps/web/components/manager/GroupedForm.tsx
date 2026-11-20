'use client';

import { useState } from 'react';
import {
  groupFields,
  type FieldDescriptor,
  type FieldGroup,
} from '@/lib/forms/describe';
import { SchemaForm, type FieldErrors } from './SchemaForm';

const tabLabels: Record<FieldGroup, string> = {
  content: 'Content',
  style: 'Style',
};

/**
 * A generated form split into tabs by each field's `group`: what the block
 * says, how it is arranged, how it looks. One tab is shown at a time. A tab
 * holding a field with an error gets a red dot, and the form opens on the
 * first such tab, so problems are never hidden on another tab.
 */
export function GroupedForm({
  fields,
  value,
  onChange,
  errors = {},
}: {
  fields: FieldDescriptor[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  errors?: FieldErrors;
}) {
  const groups = groupFields(fields);
  // Error keys are prop paths ("cards.0.heading"); the first part is the field.
  const hasError = (group: FieldGroup) =>
    Object.keys(errors).some((path) =>
      fields.some(
        (field) => field.group === group && path.split('.')[0] === field.key,
      ),
    );
  const [tab, setTab] = useState<FieldGroup>(
    () =>
      groups.find((entry) => hasError(entry.group))?.group ??
      groups[0]?.group ??
      'content',
  );
  const current = groups.find((entry) => entry.group === tab) ?? groups[0];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 1 && (
        <div
          role="tablist"
          aria-label="Field groups"
          className="flex gap-1 rounded-full bg-[var(--ui-glass)] p-1"
        >
          {groups.map(({ group }) => (
            <button
              key={group}
              type="button"
              role="tab"
              aria-selected={group === current.group}
              onClick={() => setTab(group)}
              className={`relative flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                group === current.group
                  ? 'bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]'
                  : 'text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
              }`}
            >
              {tabLabels[group]}
              {hasError(group) && (
                <span
                  aria-label="has a problem"
                  className="absolute top-1 right-2 size-2 rounded-full bg-red-500"
                />
              )}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" aria-label={tabLabels[current.group]}>
        <SchemaForm
          fields={current.fields}
          value={value}
          onChange={onChange}
          errors={errors}
        />
      </div>
    </div>
  );
}
