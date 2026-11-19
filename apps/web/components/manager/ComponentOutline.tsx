'use client';

import { useState } from 'react';
import { Button, Dialog, IconButton } from '@scottcheung/ui/client';
import { getDefinition } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import type { TreeIssue } from '@/lib/components/validateTree';
import { describeSchema } from '@/lib/forms/describe';
import { summarizeProps } from '@/lib/forms/summarize';
import type { ComponentNode } from '@/lib/types';

type Props = {
  nodes: ComponentNode[];
  selectedId: string | null;
  issues: TreeIssue[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddInside: (parentId: string) => void;
};

/** The page tree as a nested list: select, remove, or add inside containers. */
export function ComponentOutline(props: Props) {
  const [confirming, setConfirming] = useState<ComponentNode | null>(null);
  const confirmingLabel = confirming
    ? (getDefinition(confirming.type)?.label ?? 'component')
    : '';
  const inside = confirming?.children?.length ?? 0;

  return (
    <>
      <OutlineList
        {...props}
        onRemove={(id) => setConfirming(findNode(props.nodes, id) ?? null)}
      />
      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Remove this ${confirmingLabel.toLowerCase()}?`}
        description={
          inside > 0
            ? `The ${inside} ${inside === 1 ? 'component' : 'components'} inside it will be removed too.`
            : 'You can undo this by leaving without saving.'
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirming) props.onRemove(confirming.id);
              setConfirming(null);
            }}
          >
            Remove
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function OutlineList({
  nodes,
  selectedId,
  issues,
  onSelect,
  onRemove,
  onAddInside,
}: Props) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {nodes.map((node) => {
        const definition = getDefinition(node.type);
        const label = definition?.label ?? `Unknown (${node.type})`;
        const summary = definition
          ? summarizeProps(describeSchema(definition.schema), node.props)
          : '';
        const hasIssues = issues.some((issue) => issue.nodeId === node.id);
        const selected = node.id === selectedId;
        return (
          <li key={node.id}>
            <div
              className={`flex items-center gap-1 rounded-lg border pr-1 ${
                selected
                  ? 'border-[var(--ui-primary)] bg-emerald-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                aria-current={selected || undefined}
                className="min-w-0 flex-1 px-3 py-2 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {label}
                  {hasIssues && (
                    <span className="rounded bg-red-100 px-1.5 text-xs font-medium text-red-700">
                      Needs attention
                    </span>
                  )}
                </span>
                {summary && (
                  <span className="block truncate text-xs text-slate-500">
                    {summary}
                  </span>
                )}
              </button>
              {definition?.acceptsChildren && (
                <IconButton
                  variant="ghost"
                  label={`Add a component inside this ${label}`}
                  onClick={() => onAddInside(node.id)}
                >
                  +
                </IconButton>
              )}
              <IconButton
                variant="ghost"
                label={`Remove ${label}`}
                onClick={() => onRemove(node.id)}
              >
                ×
              </IconButton>
            </div>
            {node.children && node.children.length > 0 && (
              <div className="mt-1 ml-3 border-l-2 border-slate-200 pl-2">
                <OutlineList
                  nodes={node.children}
                  selectedId={selectedId}
                  issues={issues}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onAddInside={onAddInside}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
