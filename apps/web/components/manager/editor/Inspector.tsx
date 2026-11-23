'use client';

import { ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { Checkbox, IconButton, Input, Textarea } from '@scottcheung/ui/client';
import { getBlock, getDefinition } from '@/lib/components/registry';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { TreeIssue } from '@/lib/components/validateTree';
import type { ItemRef } from '@/lib/components/items';
import { describeSchema } from '@/lib/forms/describe';
import type { CollectionId } from '@/lib/collections';
import type { PageNav } from '@/lib/types';
import type { ComponentNode } from '@/lib/types';
import { pathKey, SchemaForm, type FieldErrors } from '../SchemaForm';
import { DeletePageButton } from './DeletePageButton';
import { BlockPanel } from './BlockPanel';
import { ContainerPanel } from './ContainerPanel';
import { useScrollFade } from '../useScrollFade';
import { ItemPanel } from './ItemPanel';
import type { Draft, PageErrors } from './editorReducer';

/** One step of the breadcrumb: where you are, and the way back up. */
export type Crumb = { key: string; label: string; onSelect?: () => void };

/** The three tabs every level shares, always in this order. */
export type InspectorTab = 'content' | 'layout' | 'style';
const tabLabels: Record<InspectorTab, string> = {
  content: 'Content',
  layout: 'Layout',
  style: 'Style',
};
/**
 * One tab's body: a form, or (when this level has nothing there) a short
 * note saying who owns it, with a way to get there.
 */
type TabBody =
  | { node: ReactNode; alert?: boolean }
  | { note: string; go?: { label: string; onClick: () => void } };

export type InspectorMode =
  | { level: 'site' }
  | { level: 'page' }
  /** The site's News or Players: the list. */
  | { level: 'collection'; collection: CollectionId }
  /** One article or player, opened from that list. */
  | { level: 'entry'; collection: CollectionId; slug: string }
  | { level: 'node'; node: ComponentNode }
  | { level: 'item'; node: ComponentNode; item: ItemRef };

/**
 * The right panel, shown only while something is selected: the site's
 * settings, the page's settings, a component's form (generated from its
 * schema) or one item inside a component. The breadcrumb on top says
 * where you are and leads back up; Esc does the same (PageEditor).
 * "Wide" turns it into an overlay over most of the preview, for long lists.
 */
export function Inspector({
  mode,
  crumbs,
  sitePanel,
  collectionPanel,
  entryPanel,
  data,
  draft,
  pageId,
  savedPath,
  isTemplate,
  pageErrors,
  issues,
  wide,
  onWideChange,
  tab,
  onTabChange,
  onProps,
  onSelectItem,
  onSelect,
  onChangeType,
  onAddInto,
  onTitle,
  onDescription,
  onPath,
  onNav,
}: {
  mode: InspectorMode;
  crumbs: Crumb[];
  /** The site settings form (PageEditor owns its state). */
  sitePanel: (part: InspectorTab) => ReactNode;
  /** News or Players, as a list (PageEditor owns the entries). */
  collectionPanel: (collection: CollectionId) => ReactNode;
  /** One entry's form. */
  entryPanel: (collection: CollectionId, slug: string) => ReactNode;
  /** What blocks fed by the site's data show (news, players, matches). */
  data: SiteData;
  draft: Draft;
  pageId: string;
  /** The address as saved; the home page's cannot change. */
  savedPath: string;
  /** The page is an entry template: no address, cannot be deleted. */
  isTemplate: boolean;
  pageErrors: PageErrors;
  issues: TreeIssue[];
  wide: boolean;
  onWideChange: (wide: boolean) => void;
  /** The open tab; it stays open as the selection changes. */
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onProps: (
    id: string,
    props: Record<string, unknown>,
    separate?: boolean,
  ) => void;
  onSelectItem: (id: string, item: ItemRef | null) => void;
  /** Select a component (a block of the selected Section). */
  onSelect: (id: string) => void;
  /** Draw a block as another block type, keeping its items. */
  onChangeType: (
    id: string,
    type: string,
    props: Record<string, unknown>,
  ) => void;
  /** Ask for a new block at the end of this Section. */
  onAddInto: (sectionId: string) => void;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onPath: (path: string) => void;
  onNav: (nav: PageNav) => void;
}) {
  const {
    attach: fadeRef,
    className: fadeClass,
    style: fadeStyle,
  } = useScrollFade<HTMLDivElement>('y');
  const node =
    mode.level === 'node' || mode.level === 'item' ? mode.node : undefined;
  const definition = node && getDefinition(node.type);
  const nodeIssues = node
    ? issues.filter((issue) => issue.nodeId === node.id)
    : [];
  const fieldErrors: FieldErrors = Object.fromEntries(
    nodeIssues.map((issue) => [pathKey(issue.path), issue.message]),
  );
  const current = crumbs.at(-1)?.label ?? '';
  const hasError = (keys: string[]) =>
    Object.keys(fieldErrors).some((path) => keys.includes(path.split('.')[0]));
  const nodeProps = (props: Record<string, unknown>, separate?: boolean) =>
    node && onProps(node.id, props, separate);
  const siteOwnsLook = {
    note: 'Colours, fonts and corners are set once for the whole site, so every page stays on brand.',
    go: { label: 'Site settings', onClick: crumbs[0].onSelect! },
  };

  let bodies: Record<InspectorTab, TabBody>;
  if (mode.level === 'site')
    bodies = {
      content: { node: sitePanel('content') },
      layout: { node: sitePanel('layout') },
      style: { node: sitePanel('style') },
    };
  else if (mode.level === 'page')
    bodies = {
      content: {
        node: (
          <PageSettings
            draft={draft}
            pageId={pageId}
            savedPath={savedPath}
            isTemplate={isTemplate}
            pageErrors={pageErrors}
            onTitle={onTitle}
            onDescription={onDescription}
            onPath={onPath}
            onNav={onNav}
          />
        ),
      },
      layout: {
        note: 'A page is laid out by its Sections. Select one in the preview or in Layers.',
      },
      style: siteOwnsLook,
    };
  else if (mode.level === 'collection')
    bodies = {
      content: { node: collectionPanel(mode.collection) },
      layout: {
        note: 'Where these appear, and how they are laid out, is set by the blocks that show them on each page.',
      },
      style: siteOwnsLook,
    };
  else if (mode.level === 'entry')
    bodies = {
      content: { node: entryPanel(mode.collection, mode.slug) },
      layout: {
        note: 'Laid out by the blocks that show it, and (for articles) by the News template page.',
      },
      style: siteOwnsLook,
    };
  else if (mode.level === 'item') {
    const up = {
      label: 'Edit the block',
      onClick: () => onSelectItem(mode.node.id, null),
    };
    bodies = {
      content: {
        node: (
          <ItemPanel
            node={mode.node}
            item={mode.item}
            data={data}
            errors={fieldErrors}
            onProps={nodeProps}
            onSelectItem={(item) => onSelectItem(mode.node.id, item)}
            renderEntry={entryPanel}
          />
        ),
        alert: Object.keys(fieldErrors).length > 0,
      },
      layout: {
        note: 'Every item of a block is laid out the same way, so this is set on the block.',
        go: up,
      },
      style: {
        note: 'Every item of a block looks the same, so this is set on the block.',
        go: up,
      },
    };
  } else {
    const current = mode.node;
    const block = getBlock(current.type);
    // A tab is red when a field on it has a problem.
    const keysOf = (part: InspectorTab) =>
      block
        ? [part]
        : describeSchema(definition?.schema ?? z.object({}))
            .filter((field) => field.group === part)
            .map((field) => field.key);
    const body = (part: InspectorTab): TabBody => ({
      alert: hasError(keysOf(part)),
      node: block ? (
        <BlockPanel
          key={current.id}
          node={current}
          block={block}
          part={part}
          data={data}
          isTemplate={isTemplate}
          errors={fieldErrors}
          onProps={nodeProps}
          onChangeType={(type, props) => onChangeType(current.id, type, props)}
          onSelectItem={(item) => onSelectItem(current.id, item)}
        />
      ) : definition?.acceptsChildren ? (
        <ContainerPanel
          key={current.id}
          node={current}
          definition={definition}
          part={part}
          errors={fieldErrors}
          onProps={nodeProps}
          onSelect={onSelect}
          onAdd={() => onAddInto(current.id)}
        />
      ) : definition ? (
        <SchemaForm
          key={`${current.id}:${part}`}
          fields={describeSchema(definition.schema).filter(
            (field) => field.group === part,
          )}
          value={current.props}
          onChange={(props) => onProps(current.id, props)}
          errors={fieldErrors}
        />
      ) : (
        <p className="m-0 text-sm text-[var(--ui-muted)]">
          This component is no longer in the library. Delete it to save the
          page.
        </p>
      ),
    });
    const content = body('content');
    bodies = {
      content:
        // A Section's blocks are listed on Content: a block with a problem
        // shows there too.
        current.children && 'node' in content
          ? {
              ...content,
              alert:
                content.alert ||
                (current.children ?? []).some((child) =>
                  issues.some((issue) => issue.nodeId === child.id),
                ),
            }
          : content,
      layout: body('layout'),
      style: body('style'),
    };
  }
  const shown = bodies[tab];

  return (
    <aside
      aria-label={current}
      className={
        wide
          ? // Over the preview, leaving a strip of it visible on the left.
            'absolute inset-y-0 right-0 z-20 flex w-[min(60rem,calc(100%-6rem))] flex-col border-l border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-md)]'
          : 'flex w-[25rem] shrink-0 flex-col border-l border-[var(--ui-border)] bg-[var(--ui-surface)]'
      }
    >
      <div className="flex items-start gap-1 border-b border-[var(--ui-border)] py-2 pr-2 pl-4">
        <nav aria-label="Where you are" className="min-w-0 flex-1 py-1.5">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-1 gap-y-0.5 p-0 text-[0.8125rem]">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={crumb.key} className="flex min-w-0 items-center gap-1">
                  {last || !crumb.onSelect ? (
                    <span
                      aria-current={last ? 'location' : undefined}
                      className={`truncate ${last ? 'font-semibold text-[var(--ui-fg)]' : 'text-[var(--ui-muted)]'}`}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={crumb.onSelect}
                      className="max-w-[10rem] truncate text-[var(--ui-muted)] hover:text-[var(--ui-primary)] hover:underline"
                    >
                      {crumb.label}
                    </button>
                  )}
                  {!last && (
                    <ChevronRight
                      aria-hidden
                      className="size-3.5 shrink-0 text-[var(--ui-faint)]"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <IconButton
          variant="ghost"
          label={wide ? 'Narrow panel' : 'Wide panel'}
          onClick={() => onWideChange(!wide)}
        >
          {wide ? <Minimize2 /> : <Maximize2 />}
        </IconButton>
      </div>

      <div
        role="tablist"
        aria-label="Edit"
        className="mx-4 mt-3 flex gap-1 rounded-full bg-[var(--ui-glass)] p-1"
      >
        {(Object.keys(tabLabels) as InspectorTab[]).map((id) => {
          const body = bodies[id];
          const empty = 'note' in body;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === tab}
              onClick={() => onTabChange(id)}
              className={`relative flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                id === tab
                  ? 'bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]'
                  : empty
                    ? 'text-[var(--ui-faint)] hover:text-[var(--ui-muted)]'
                    : 'text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
              }`}
            >
              {tabLabels[id]}
              {!empty && body.alert && (
                <span
                  aria-label="has a problem"
                  className="absolute top-1 right-2 size-2 rounded-full bg-[var(--ui-danger)]"
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        ref={fadeRef}
        style={fadeStyle}
        className={`min-h-0 flex-1 overflow-y-auto p-4 ${fadeClass}`}
      >
        <div className={wide ? 'mx-auto max-w-3xl' : undefined}>
          {/* Problems with the component itself rather than one field. */}
          {nodeIssues
            .filter((issue) => issue.path.length === 0)
            .map((issue) => (
              <p key={issue.message} className="sc-ui-error mt-0 mb-4">
                {issue.message}
              </p>
            ))}
          {'note' in shown ? (
            <div className="flex flex-col items-start gap-3 rounded-xl bg-[var(--ui-glass)] p-4 text-sm text-[var(--ui-muted)]">
              <p className="m-0">{shown.note}</p>
              {shown.go && (
                <button
                  type="button"
                  onClick={shown.go.onClick}
                  className="font-semibold text-[var(--ui-primary)] hover:underline"
                >
                  {shown.go.label} →
                </button>
              )}
            </div>
          ) : (
            shown.node
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
  isTemplate,
  pageErrors,
  onTitle,
  onDescription,
  onPath,
  onNav,
}: {
  draft: Draft;
  pageId: string;
  savedPath: string;
  isTemplate: boolean;
  pageErrors: PageErrors;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onPath: (path: string) => void;
  onNav: (nav: PageNav) => void;
}) {
  if (isTemplate)
    return (
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          hint="Only shown here, in the manager."
          value={draft.title}
          error={pageErrors.title}
          onChange={(event) => onTitle(event.target.value)}
        />
        <p className="m-0 text-sm text-[var(--ui-muted)]">
          This page draws every article, at /news/&lt;article&gt;. The title and
          description of each article come from the article itself.
        </p>
      </div>
    );
  // Only top-level pages ("/about", not "/news/story") are in the menu.
  const inMenu = savedPath.split('/').length === 2;
  const setNav = (change: PageNav) => {
    const next = { ...draft.nav, ...change };
    if (!next.label) delete next.label;
    if (!next.hidden) delete next.hidden;
    onNav(next);
  };
  const menu = inMenu ? (
    <fieldset className="m-0 flex flex-col gap-3 border-0 border-t border-[var(--ui-border)] p-0 pt-4">
      <legend className="sc-ui-overline mb-1">Site menu</legend>
      <Checkbox
        label="Show in the site menu"
        checked={!draft.nav.hidden}
        disabled={savedPath === '/'}
        onChange={(event) => setNav({ hidden: !event.target.checked })}
      />
      <Input
        label="Menu label (optional)"
        hint="A shorter name for the menu. Leave it empty to use the title. The order is set in Site settings."
        placeholder={savedPath === '/' ? 'Home' : draft.title}
        value={draft.nav.label ?? ''}
        error={pageErrors.nav}
        onChange={(event) => setNav({ label: event.target.value })}
      />
    </fieldset>
  ) : (
    <p className="m-0 text-sm text-[var(--ui-muted)]">
      Only top-level pages are in the site menu; this one is reached through
      links.
    </p>
  );
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
        <Input
          label="Address"
          hint="Where the page lives on the site, e.g. /about. Links to the old address stop working when you change it."
          value={draft.path}
          error={pageErrors.path}
          onChange={(event) => onPath(event.target.value)}
        />
      )}
      {menu}
      {savedPath !== '/' && (
        <DeletePageButton pageId={pageId} title={draft.title} />
      )}
    </div>
  );
}
