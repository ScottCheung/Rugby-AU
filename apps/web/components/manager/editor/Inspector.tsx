'use client';

import { Maximize2, Minimize2, X } from 'lucide-react';
import { IconButton, Input, Textarea } from '@scottcheung/ui/client';
import { getDefinition } from '@/lib/components/registry';
import type { TreeIssue } from '@/lib/components/validateTree';
import { describeSchema } from '@/lib/forms/describe';
import type { ComponentNode } from '@/lib/types';
import { GroupedForm } from '../GroupedForm';
import { pathKey, type FieldErrors } from '../SchemaForm';
import { ComponentIcon } from './componentIcons';
import { DeletePageButton } from './DeletePageButton';
import type { Draft, PageErrors } from './editorReducer';

/**
 * The right panel, shown only while something is selected: the selected
 * component's form (generated from its schema) or the page settings.
 * "Wide" turns it into an overlay over most of the preview, for long lists.
 */
export function Inspector({
  node,
  draft,
  pageId,
  savedPath,
  pageErrors,
  issues,
  wide,
  onWideChange,
  onClose,
  onProps,
  onTitle,
  onDescription,
  onPath,
}: {
  /** The selected component, or undefined for the page settings. */
  node: ComponentNode | undefined;
  draft: Draft;
  pageId: string;
  /** The address as saved; the home page's cannot change. */
  savedPath: string;
  pageErrors: PageErrors;
  issues: TreeIssue[];
  wide: boolean;
  onWideChange: (wide: boolean) => void;
  onClose: () => void;
  onProps: (id: string, props: Record<string, unknown>) => void;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onPath: (path: string) => void;
}) {
  const definition = node && getDefinition(node.type);
  const title = node
    ? (definition?.label ?? `Unknown (${node.type})`)
    : 'Page settings';
  const nodeIssues = node
    ? issues.filter((issue) => issue.nodeId === node.id)
    : [];
  const fieldErrors: FieldErrors = Object.fromEntries(
    nodeIssues.map((issue) => [pathKey(issue.path), issue.message]),
  );

  return (
    <aside
      aria-label={title}
      className={
        wide
          ? // Over the preview, leaving a strip of it visible on the left.
            'absolute inset-y-0 right-0 z-20 flex w-[min(60rem,calc(100%-6rem))] flex-col border-l border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-md)]'
          : 'flex w-[25rem] shrink-0 flex-col border-l border-[var(--ui-border)] bg-[var(--ui-surface)]'
      }
    >
      <div className="flex items-center gap-2 border-b border-[var(--ui-border)] px-4 py-3">
        {node && (
          <ComponentIcon
            type={node.type}
            className="size-5 shrink-0 text-[var(--ui-primary)]"
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="sc-ui-typography sc-ui-h3 truncate">{title}</h2>
          {node && definition && (
            <p className="m-0 truncate text-xs text-[var(--ui-muted)]">
              {definition.description}
            </p>
          )}
        </div>
        <IconButton
          variant="ghost"
          label={wide ? 'Narrow panel' : 'Wide panel'}
          onClick={() => onWideChange(!wide)}
        >
          {wide ? <Minimize2 /> : <Maximize2 />}
        </IconButton>
        <IconButton variant="ghost" label="Close panel" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className={wide ? 'mx-auto max-w-3xl' : undefined}>
          {node ? (
            <div className="flex flex-col gap-4">
              {/* Problems with the component itself rather than one field. */}
              {nodeIssues
                .filter((issue) => issue.path.length === 0)
                .map((issue) => (
                  <p key={issue.message} className="sc-ui-error m-0">
                    {issue.message}
                  </p>
                ))}
              {definition ? (
                <GroupedForm
                  // Remount per component so tabs and open list items never carry over.
                  key={node.id}
                  fields={describeSchema(definition.schema)}
                  value={node.props}
                  onChange={(props) => onProps(node.id, props)}
                  errors={fieldErrors}
                />
              ) : (
                <p className="m-0 text-sm text-[var(--ui-muted)]">
                  This component is no longer in the library. Delete it to save
                  the page.
                </p>
              )}
            </div>
          ) : (
            <PageSettings
              draft={draft}
              pageId={pageId}
              savedPath={savedPath}
              pageErrors={pageErrors}
              onTitle={onTitle}
              onDescription={onDescription}
              onPath={onPath}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

function PageSettings({
  draft,
  pageId,
  savedPath,
  pageErrors,
  onTitle,
  onDescription,
  onPath,
}: {
  draft: Draft;
  pageId: string;
  savedPath: string;
  pageErrors: PageErrors;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onPath: (path: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Title"
        hint="Shown in the browser tab, search results and the site menu."
        value={draft.title}
        error={pageErrors.title}
        onChange={(event) => onTitle(event.target.value)}
      />
      <Textarea
        label="Description (optional)"
        hint="A sentence for search results and link previews."
        value={draft.description}
        error={pageErrors.description}
        onChange={(event) => onDescription(event.target.value)}
      />
      {savedPath === '/' ? (
        <p className="m-0 text-sm text-[var(--ui-muted)]">
          This is the home page: its address is always /.
        </p>
      ) : (
        <>
          <Input
            label="Address"
            hint="Where the page lives on the site, e.g. /about. Links to the old address stop working when you change it."
            value={draft.path}
            error={pageErrors.path}
            onChange={(event) => onPath(event.target.value)}
          />
          <DeletePageButton pageId={pageId} title={draft.title} />
        </>
      )}
    </div>
  );
}
