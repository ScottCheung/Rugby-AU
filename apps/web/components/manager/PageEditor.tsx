'use client';

import Link from 'next/link';
import { useEffect, useReducer, useState, useTransition } from 'react';
import { Badge, Card, H2 } from '@scottcheung/ui';
import { Button, Input, Textarea, useToast } from '@scottcheung/ui/client';
import { savePageAction } from '@/app/manager/actions';
import { createNode } from '@/lib/components/createNode';
import { getDefinition, type ComponentType } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import { describeSchema } from '@/lib/forms/describe';
import type { Page, Site } from '@/lib/types';
import { AddComponentDialog } from './AddComponentDialog';
import { ComponentOutline } from './ComponentOutline';
import { editorReducer, initEditor, isDirty } from './editorReducer';
import { pathKey, SchemaForm, type FieldErrors } from './SchemaForm';

export function PageEditor({ site, page }: { site: Site; page: Page }) {
  const [state, dispatch] = useReducer(
    editorReducer,
    { title: page.title, description: page.description ?? '', tree: page.tree },
    initEditor,
  );
  // null = closed; { parentId: undefined } = add at the page root.
  const [adding, setAdding] = useState<{ parentId?: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const toast = useToast();
  const dirty = isDirty(state);
  const liveUrl = `/sites/${site.slug}${page.path === '/' ? '' : page.path}`;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function save() {
    startSaving(async () => {
      const result = await savePageAction(page.id, state.draft);
      if (result.ok) {
        const { title, description = '', tree } = result.page;
        dispatch({ type: 'saved', draft: { title, description, tree } });
        toast({
          title: 'Page saved',
          description: 'The live page now shows these changes.',
          tone: 'success',
        });
      } else {
        dispatch({
          type: 'saveFailed',
          issues: result.issues,
          pageErrors: result.pageErrors,
        });
        toast({
          title: result.message,
          description: 'Fields with problems are marked in red.',
          tone: 'danger',
        });
      }
    });
  }

  function add(type: ComponentType) {
    const parentId = adding?.parentId;
    const siblings = parentId
      ? (findNode(state.draft.tree, parentId)?.children ?? [])
      : state.draft.tree;
    dispatch({
      type: 'insertNode',
      node: createNode(type),
      at: { parentId, index: siblings.length },
    });
    setAdding(null);
  }

  const selected = state.selectedId
    ? findNode(state.draft.tree, state.selectedId)
    : undefined;
  const definition = selected && getDefinition(selected.type);
  const selectedIssues = state.issues.filter(
    (issue) => issue.nodeId === selected?.id,
  );
  const fieldErrors: FieldErrors = Object.fromEntries(
    selectedIssues.map((issue) => [pathKey(issue.path), issue.message]),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: where you are, save state and actions. */}
      <div className="flex flex-wrap items-center gap-3">
        <nav className="w-full text-sm text-slate-500 sm:w-auto sm:min-w-0 sm:flex-1">
          <Link href="/manager" className="hover:underline">
            Sites
          </Link>{' '}
          /{' '}
          <Link href={`/manager/${site.slug}`} className="hover:underline">
            {site.name}
          </Link>{' '}
          /{' '}
          <span className="text-slate-800">
            {state.draft.title || 'Untitled page'}
          </span>
        </nav>
        {dirty ? (
          <Badge tone="warning">Unsaved changes</Badge>
        ) : (
          <Badge tone="success">All changes saved</Badge>
        )}
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="sc-ui-button"
          data-variant="secondary"
        >
          View live page ↗
        </a>
        <Button
          onClick={save}
          loading={saving}
          disabled={!dirty && state.issues.length === 0}
        >
          Save
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <H2 className="m-0 text-lg">Page settings</H2>
            <Input
              label="Title"
              hint="Shown in the browser tab and search results."
              value={state.draft.title}
              error={state.pageErrors.title}
              onChange={(event) =>
                dispatch({ type: 'setTitle', title: event.target.value })
              }
            />
            <Textarea
              label="Description (optional)"
              hint="A sentence for search results and link previews."
              value={state.draft.description}
              error={state.pageErrors.description}
              onChange={(event) =>
                dispatch({
                  type: 'setDescription',
                  description: event.target.value,
                })
              }
            />
            <p className="m-0 text-sm text-slate-500">
              Address:{' '}
              <span className="font-mono text-slate-700">{page.path}</span>
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <H2 className="m-0 text-lg">Components</H2>
              <Button size="sm" onClick={() => setAdding({})}>
                + Add component
              </Button>
            </div>
            {state.draft.tree.length === 0 ? (
              <p className="m-0 rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                This page has no components yet. Add one to get started.
              </p>
            ) : (
              <ComponentOutline
                nodes={state.draft.tree}
                selectedId={state.selectedId}
                issues={state.issues}
                onSelect={(id) => dispatch({ type: 'select', id })}
                onRemove={(id) => dispatch({ type: 'removeNode', id })}
                onAddInside={(parentId) => setAdding({ parentId })}
              />
            )}
          </Card>
        </div>

        <Card className="flex flex-col gap-4">
          {!selected ? (
            <div className="py-10 text-center text-slate-500">
              {state.draft.tree.length === 0
                ? 'Add a component on the left, then edit its content here.'
                : 'Select a component on the left to edit its content.'}
            </div>
          ) : !definition ? (
            <p className="m-0 text-amber-700">
              This component ({selected.type}) is no longer in the library.
              Remove it to save the page.
            </p>
          ) : (
            <>
              <div>
                <H2 className="m-0 text-lg">{definition.label}</H2>
                <p className="m-0 text-sm text-slate-500">
                  {definition.description}
                </p>
              </div>
              {selectedIssues
                .filter((issue) => issue.path.length === 0)
                .map((issue) => (
                  <p key={issue.message} className="sc-ui-error m-0">
                    {issue.message}
                  </p>
                ))}
              <SchemaForm
                fields={describeSchema(definition.schema)}
                value={selected.props}
                onChange={(props) =>
                  dispatch({ type: 'updateProps', id: selected.id, props })
                }
                errors={fieldErrors}
              />
              {definition.acceptsChildren && (
                <Button
                  variant="secondary"
                  className="self-start"
                  onClick={() => setAdding({ parentId: selected.id })}
                >
                  + Add a component inside this {definition.label.toLowerCase()}
                </Button>
              )}
            </>
          )}
        </Card>
      </div>

      <AddComponentDialog
        open={adding !== null}
        insideLabel={
          adding?.parentId
            ? getDefinition(
                findNode(state.draft.tree, adding.parentId)?.type ?? '',
              )?.label
            : undefined
        }
        onPick={add}
        onClose={() => setAdding(null)}
      />
    </div>
  );
}
