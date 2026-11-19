'use client';

import { Trash2 } from 'lucide-react';
import { getDefinition } from '@/lib/components/registry';
import { describeSchema } from '@/lib/forms/describe';
import { summarizeProps } from '@/lib/forms/summarize';
import type { ComponentNode } from '@/lib/types';
import { ComponentIcon } from './componentIcons';
import { useEditor } from './editorContext';

/** The page tree as an outline: handy for picking deeply nested blocks. */
export function Layers() {
  const editor = useEditor();
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <span className="sc-ui-overline">Layers</span>
      {editor.tree.length === 0 ? (
        <p className="m-0 text-sm text-[var(--ui-faint)]">
          This page has no components yet.
        </p>
      ) : (
        <LayerList nodes={editor.tree} depth={0} />
      )}
    </div>
  );
}

function LayerList({
  nodes,
  depth,
}: {
  nodes: ComponentNode[];
  depth: number;
}) {
  const editor = useEditor();
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {nodes.map((node) => {
        const definition = getDefinition(node.type);
        const label = definition?.label ?? `Unknown (${node.type})`;
        const summary = definition
          ? summarizeProps(describeSchema(definition.schema), node.props)
          : '';
        const selected = editor.selectedId === node.id;
        const hasIssues = editor.issues.some(
          (issue) => issue.nodeId === node.id,
        );
        return (
          <li key={node.id}>
            <div
              onMouseEnter={() => editor.hover(node.id)}
              onMouseLeave={() => editor.hover(null)}
              style={{ paddingLeft: `${depth * 0.9 + 0.5}rem` }}
              className={`group flex items-center gap-2 rounded-full pr-1 transition ${
                selected
                  ? 'bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)]'
                  : editor.hoveredId === node.id
                    ? 'bg-[var(--ui-glass)]'
                    : ''
              }`}
            >
              <button
                type="button"
                onClick={() => editor.select(node.id)}
                aria-current={selected || undefined}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              >
                <ComponentIcon
                  type={node.type}
                  className="size-4 shrink-0 opacity-80"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {label}
                  </span>
                  {summary && (
                    <span
                      className={`block truncate text-xs ${selected ? 'opacity-80' : 'text-[var(--ui-faint)]'}`}
                    >
                      {summary}
                    </span>
                  )}
                </span>
                {hasIssues && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-red-500"
                    aria-label="Needs attention"
                  />
                )}
              </button>
              <button
                type="button"
                aria-label={`Delete ${label}`}
                onClick={() => editor.remove(node.id)}
                className="grid size-7 shrink-0 place-items-center rounded-full opacity-0 transition group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {node.children && node.children.length > 0 && (
              <LayerList nodes={node.children} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
