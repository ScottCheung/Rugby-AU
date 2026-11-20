'use client';

import { Copy, Trash2 } from 'lucide-react';
import { Input, Textarea } from '@scottcheung/ui/client';
import { getDefinition } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import { describeSchema } from '@/lib/forms/describe';
import { pathKey, SchemaForm, type FieldErrors } from '../SchemaForm';
import { ComponentIcon } from './componentIcons';
import { DeletePageButton } from './DeletePageButton';
import { useEditor } from './editorContext';
import type { Draft, PageErrors } from './editorReducer';

/**
 * The right-hand panel: the selected block's fields, generated from its
 * schema, or the page settings when nothing is selected.
 */
export function PropertiesPanel({
  draft,
  pageErrors,
  pageId,
  savedPath,
  onTitle,
  onDescription,
  onPath,
  onProps,
}: {
  draft: Draft;
  pageErrors: PageErrors;
  pageId: string;
  /** The address as saved; the home page's cannot change. */
  savedPath: string;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onPath: (path: string) => void;
  onProps: (id: string, props: Record<string, unknown>) => void;
}) {
  const editor = useEditor();
  const node = editor.selectedId
    ? findNode(editor.tree, editor.selectedId)
    : undefined;

  if (!node) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <span className="sc-ui-overline">Page settings</span>
          <p className="m-0 mt-1 text-sm text-[var(--ui-muted)]">
            Click a block on the page to edit it.
          </p>
        </div>
        <Input
          label="Title"
          hint="Shown in the browser tab and search results."
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
            Address{' '}
            <span className="ml-1 rounded-full bg-[var(--ui-glass)] px-2 py-0.5 font-mono text-xs">
              /
            </span>{' '}
            (the home page)
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

  const definition = getDefinition(node.type);
  const issues = editor.issues.filter((issue) => issue.nodeId === node.id);
  const fieldErrors: FieldErrors = Object.fromEntries(
    issues.map((issue) => [pathKey(issue.path), issue.message]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)]">
          <ComponentIcon type={node.type} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="sc-ui-typography sc-ui-h2">
            {definition?.label ?? `Unknown (${node.type})`}
          </h2>
          <p className="m-0 text-xs text-[var(--ui-muted)]">
            {definition?.description ??
              'This block is no longer in the library. Remove it to save the page.'}
          </p>
        </div>
        <button
          type="button"
          className="sc-ui-icon-button"
          aria-label="Duplicate block"
          title="Duplicate"
          onClick={() => editor.duplicate(node.id)}
        >
          <Copy />
        </button>
        <button
          type="button"
          className="sc-ui-icon-button"
          aria-label="Delete block"
          title="Delete"
          onClick={() => editor.remove(node.id)}
        >
          <Trash2 />
        </button>
      </div>
      {issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => (
          <p key={issue.message} className="sc-ui-error m-0">
            {issue.message}
          </p>
        ))}
      {definition && (
        <SchemaForm
          // Remount per block so list items and inputs never carry over.
          key={node.id}
          fields={describeSchema(definition.schema)}
          value={node.props}
          onChange={(props) => onProps(node.id, props)}
          errors={fieldErrors}
        />
      )}
    </div>
  );
}
