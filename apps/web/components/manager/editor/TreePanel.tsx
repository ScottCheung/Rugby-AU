'use client';

import {
  ArrowDown,
  ArrowUp,
  Copy,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { IconButton, TreeItem } from '@scottcheung/ui/client';
import { getDefinition } from '@/lib/components/registry';
import type { TreeIssue } from '@/lib/components/validateTree';
import { describeSchema } from '@/lib/forms/describe';
import { summarizeProps } from '@/lib/forms/summarize';
import type { ComponentNode } from '@/lib/types';
import { ComponentIcon } from './componentIcons';

/** What the tree panel can ask the editor to do. */
export type TreeActions = {
  selectPage: () => void;
  select: (id: string) => void;
  /** Open the component picker for this Section, or the page when undefined. */
  add: (parentId?: string) => void;
  move: (id: string, step: -1 | 1) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
};

/**
 * The left panel: the page's components as an outline, at any depth.
 * Collapses to a thin rail so the preview gets the room.
 */
export function TreePanel({
  title,
  tree,
  selectedId,
  pageSelected,
  issues,
  collapsed,
  onCollapsedChange,
  actions,
}: {
  title: string;
  tree: ComponentNode[];
  selectedId: string | null;
  pageSelected: boolean;
  issues: TreeIssue[];
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  actions: TreeActions;
}) {
  if (collapsed)
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
        <IconButton
          variant="ghost"
          label="Show components"
          onClick={() => onCollapsedChange(false)}
        >
          <PanelLeftOpen />
        </IconButton>
        <IconButton
          variant="ghost"
          label="Add a component to the page"
          onClick={() => actions.add()}
        >
          <Plus />
        </IconButton>
      </aside>
    );

  return (
    <aside
      aria-label="Page components"
      className="flex w-80 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)]"
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <span className="sc-ui-overline">Components</span>
        <IconButton
          variant="ghost"
          label="Hide components"
          onClick={() => onCollapsedChange(true)}
        >
          <PanelLeftClose />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {/* The page itself: its settings, and "+" to add at the top level. */}
        <TreeItem
          label={title || 'Untitled page'}
          description="Page settings"
          icon={<FileText />}
          selected={pageSelected}
          onSelect={actions.selectPage}
          actions={
            <IconButton
              variant="ghost"
              label="Add a component to the page"
              onClick={() => actions.add()}
            >
              <Plus />
            </IconButton>
          }
        />
        {tree.length === 0 ? (
          <p className="m-0 px-3 py-4 text-sm text-[var(--ui-muted)]">
            This page is empty. Press + above to add the first component.
          </p>
        ) : (
          <NodeList
            nodes={tree}
            depth={1}
            selectedId={selectedId}
            issues={issues}
            actions={actions}
          />
        )}
      </div>
    </aside>
  );
}

function NodeList({
  nodes,
  depth,
  selectedId,
  issues,
  actions,
}: {
  nodes: ComponentNode[];
  depth: number;
  selectedId: string | null;
  issues: TreeIssue[];
  actions: TreeActions;
}) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {nodes.map((node, index) => {
        const definition = getDefinition(node.type);
        const label = definition?.label ?? `Unknown (${node.type})`;
        return (
          <li key={node.id}>
            <TreeItem
              depth={depth}
              label={label}
              description={
                definition &&
                summarizeProps(describeSchema(definition.schema), node.props)
              }
              icon={<ComponentIcon type={node.type} />}
              selected={selectedId === node.id}
              invalid={issues.some((issue) => issue.nodeId === node.id)}
              onSelect={() => actions.select(node.id)}
              actions={
                <>
                  {definition?.acceptsChildren && (
                    <IconButton
                      variant="ghost"
                      label={`Add a component inside this ${label}`}
                      onClick={() => actions.add(node.id)}
                    >
                      <Plus />
                    </IconButton>
                  )}
                  <IconButton
                    variant="ghost"
                    label="Move up"
                    disabled={index === 0}
                    onClick={() => actions.move(node.id, -1)}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    label="Move down"
                    disabled={index === nodes.length - 1}
                    onClick={() => actions.move(node.id, 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    label="Duplicate"
                    onClick={() => actions.duplicate(node.id)}
                  >
                    <Copy />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    label={`Delete ${label}`}
                    onClick={() => actions.remove(node.id)}
                  >
                    <Trash2 />
                  </IconButton>
                </>
              }
            />
            {node.children && node.children.length > 0 && (
              <NodeList
                nodes={node.children}
                depth={depth + 1}
                selectedId={selectedId}
                issues={issues}
                actions={actions}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
