'use client';

import { Plus } from 'lucide-react';
import { Button } from '@scottcheung/ui/client';
import { nodeName } from '@/lib/components/outline';
import type { AnyComponentDefinition } from '@/lib/components/registry';
import { columnCount } from '@/lib/components/section';
import { describeSchema } from '@/lib/forms/describe';
import type { ComponentNode } from '@/lib/types';
import { SchemaForm, type FieldErrors } from '../SchemaForm';
import type { Part } from './BlockPanel';
import { ComponentIcon } from './componentIcons';

/**
 * A container (a Section), one tab at a time. The fields are its schema's,
 * each on the tab its `group` names (for a Section: heading and intro;
 * columns, alignment, width and padding; background). The Content tab also
 * lists what is inside (a row selects one) with "Add a block".
 */
export function ContainerPanel({
  node,
  definition,
  part,
  errors,
  onProps,
  onSelect,
  onAdd,
}: {
  node: ComponentNode;
  definition: AnyComponentDefinition;
  part: Part;
  errors: FieldErrors;
  onProps: (props: Record<string, unknown>, separate?: boolean) => void;
  onSelect: (id: string) => void;
  /** Ask for a new block at the end of this Section. */
  onAdd: () => void;
}) {
  const children = node.children ?? [];
  const columns = columnCount(node.props.columns);
  const fields = describeSchema(definition.schema).filter(
    (field) =>
      field.group === part &&
      // Lining columns up only matters with more than one.
      (field.key !== 'align' || columns > 1),
  );
  return (
    <div className="flex flex-col gap-5">
      <SchemaForm
        key={`${node.id}:${part}`}
        fields={fields}
        // With the schema's defaults filled in, so the padding shows Medium.
        value={
          (definition.schema.safeParse(node.props).data as
            Record<string, unknown> | undefined) ?? node.props
        }
        onChange={(next) => onProps(next, next.columns !== node.props.columns)}
        errors={errors}
      />
      {part === 'content' && (
        <section className="flex flex-col gap-2">
          <h3 className="sc-ui-overline m-0">Blocks · {children.length}</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className="flex w-full items-center gap-2 rounded-xl border border-[var(--ui-border)] px-3 py-2 text-left text-sm hover:border-[var(--ui-primary)] hover:bg-[var(--ui-primary-soft)]"
                >
                  <ComponentIcon
                    node={child}
                    className="size-4 shrink-0 text-[var(--ui-muted)]"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {nodeName(child).name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div>
            <Button size="sm" variant="secondary" onClick={onAdd}>
              <Plus /> Add a block
            </Button>
          </div>
          <p className="m-0 text-xs text-[var(--ui-muted)]">
            {columns > 1
              ? `Blocks fill the ${columns} columns in order and wrap to a new row. The columns are set under Layout.`
              : 'Blocks stack one under another. Side by side is set under Layout.'}
          </p>
        </section>
      )}
    </div>
  );
}
