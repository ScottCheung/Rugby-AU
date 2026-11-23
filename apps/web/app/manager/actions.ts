'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTree, type TreeIssue } from '@/lib/components/validateTree';
import {
  createPage,
  deletePage,
  discardDraft,
  getPageById,
  getVersion,
  listPages,
  listVersions,
  publishPage,
  restoreVersion,
  saveDraft,
} from '@/lib/db/pages';
import { getSiteBySlug, updateSite } from '@/lib/db/sites';
import { collectionIds, type CollectionId } from '@/lib/collections';
import { pruneEntryRefs } from '@/lib/collections/prune';
import { listEntries } from '@/lib/db/entries';
import {
  applySettings,
  contrastColour,
  siteSettingsSchema,
} from '@/lib/site/settings';
import { isValidPath, normalizePath } from '@/lib/paths';
import type { ComponentNode, Page, Site } from '@/lib/types';

// ---------------------------------------------------------------- new page

export type CreatePageState = { error?: string; title: string; path: string };

/** Used with useActionState; siteSlug is bound on the server page. */
export async function createPageAction(
  siteSlug: string,
  _previous: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  const title = String(formData.get('title') ?? '').trim();
  const rawPath = String(formData.get('path') ?? '');
  const path = normalizePath(rawPath);
  const keep = { title, path: rawPath };

  if (!title) return { ...keep, error: 'Give the page a title.' };
  if (!isValidPath(path))
    return {
      ...keep,
      error:
        'Use lowercase letters, numbers and hyphens for the path, for example /about or /news/2026.',
    };
  if (!(await getSiteBySlug(siteSlug)))
    return { ...keep, error: 'This site no longer exists.' };

  const result = await createPage({ siteSlug, path, title });
  if (!result.ok)
    return {
      ...keep,
      error: `This site already has a page at ${path}. Choose another path.`,
    };

  redirect(`/manager/${siteSlug}/pages/${result.page.id}`);
}

// -------------------------------------------------------------- save draft

const pageSettings = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the page a title.')
    .max(120, 'Keep the title under 120 characters.'),
  description: z
    .string()
    .trim()
    .max(300, 'Keep the description under 300 characters.'),
  nav: z
    .object({
      label: z
        .string()
        .trim()
        .max(40, 'Keep the menu label under 40 characters.')
        .optional(),
      hidden: z.boolean().optional(),
    })
    .optional(),
  path: z
    .string()
    .transform(normalizePath)
    .refine(
      isValidPath,
      'Use lowercase letters, numbers and hyphens, for example /about.',
    ),
});

type PageErrors = {
  title?: string;
  description?: string;
  path?: string;
  nav?: string;
};

export type SavePageResult =
  | { ok: true; page: Page }
  | {
      ok: false;
      message: string;
      pageErrors: PageErrors;
      issues: TreeIssue[];
    };

/**
 * Save draft. Validates the whole page with the component schemas, then
 * writes the draft only; the public page does not change until publish.
 * The client validates nothing it relies on: this is the gate to the DB.
 */
export async function savePageAction(
  pageId: string,
  input: {
    title: string;
    description: string;
    path: string;
    nav?: { label?: string; hidden?: boolean };
    tree: unknown;
  },
): Promise<SavePageResult> {
  const existing = await getPageById(pageId);
  if (!existing)
    return {
      ok: false,
      message: 'This page no longer exists.',
      pageErrors: {},
      issues: [],
    };

  // A template page keeps its address (one no editor could type): it is
  // checked as "/" and stored with its own.
  const settings = pageSettings.safeParse(
    existing.template ? { ...input, path: '/' } : input,
  );
  const path = existing.template ? existing.path : settings.data?.path;
  const tree = validateTree(input.tree);
  const pageErrors: PageErrors = {};
  for (const issue of settings.error?.issues ?? []) {
    const key = issue.path[0];
    if (
      key === 'title' ||
      key === 'description' ||
      key === 'path' ||
      key === 'nav'
    )
      pageErrors[key] = issue.message;
  }
  // Every site keeps its home page at "/".
  if (settings.success && existing.path === '/' && path !== '/')
    pageErrors.path = 'The home page always lives at /.';

  if (!settings.success || !tree.ok || pageErrors.path) {
    const issues = tree.ok ? [] : tree.issues;
    const count = issues.length + Object.keys(pageErrors).length;
    return {
      ok: false,
      message: `Not saved: ${count} ${count === 1 ? 'field needs' : 'fields need'} attention.`,
      pageErrors,
      issues,
    };
  }

  // Blocks may name entries that have since been deleted.
  const entries = await listEntries(existing.siteSlug);
  const slugs = Object.fromEntries(
    collectionIds.map((id) => [
      id,
      new Set(entries.filter((e) => e.collection === id).map((e) => e.slug)),
    ]),
  ) as Record<CollectionId, Set<string>>;
  const result = await saveDraft(pageId, {
    path: path ?? existing.path,
    draft: {
      title: settings.data.title,
      description: settings.data.description || undefined,
      nav: {
        ...(settings.data.nav?.label ? { label: settings.data.nav.label } : {}),
        ...(settings.data.nav?.hidden ? { hidden: true } : {}),
      },
      components: pruneEntryRefs(tree.tree, slugs),
    },
  });
  if (!result.ok)
    return result.reason === 'duplicate-path'
      ? {
          ok: false,
          message: 'Not saved: the address is taken.',
          pageErrors: {
            path: `This site already has a page at ${settings.data.path}.`,
          },
          issues: [],
        }
      : {
          ok: false,
          message: 'This page no longer exists.',
          pageErrors: {},
          issues: [],
        };
  return result;
}

// ---------------------------------------------------------------- publish

export type PublishActionResult =
  | { ok: true; page: Page }
  | { ok: false; message: string; issues: TreeIssue[] };

/** Publish the saved draft (the editor saves first if it has changes). */
export async function publishPageAction(
  pageId: string,
): Promise<PublishActionResult> {
  const result = await publishPage(pageId);
  if (result.ok) return result;
  if (result.reason === 'invalid')
    return {
      ok: false,
      message: 'Not published: some components need attention.',
      issues: result.issues,
    };
  return { ok: false, message: 'This page no longer exists.', issues: [] };
}

/** Discard changes: the draft goes back to the published version. */
export async function discardDraftAction(pageId: string): Promise<Page | null> {
  return discardDraft(pageId);
}

// --------------------------------------------------------------- versions

export async function listVersionsAction(pageId: string) {
  return listVersions(pageId);
}

/** One old version's content, for viewing it in the preview. */
export async function getVersionAction(
  pageId: string,
  version: number,
): Promise<{ title: string; components: ComponentNode[] } | null> {
  const found = await getVersion(pageId, version);
  return found && { title: found.title, components: found.components };
}

/** Restore to draft: the old version becomes the draft; publish as usual. */
export async function restoreVersionAction(
  pageId: string,
  version: number,
): Promise<Page | null> {
  return restoreVersion(pageId, version);
}

// ------------------------------------------------------------- delete page

/** Deletes a page and returns to the site's page list. The home page stays. */
export async function deletePageAction(
  pageId: string,
): Promise<{ error: string }> {
  const page = await getPageById(pageId);
  if (!page) return { error: 'This page no longer exists.' };
  if (page.path === '/') return { error: 'The home page cannot be deleted.' };
  await deletePage(pageId);
  redirect(`/manager/${page.siteSlug}`);
}

// ----------------------------------------------------------- site settings

export type SaveSiteResult =
  | { ok: true; site: Site }
  | { ok: false; message: string; errors: Record<string, string> };

/**
 * Save the site settings. They have no draft: every page shows them as
 * soon as they are saved. Validated here, whatever the form allowed.
 */
export async function saveSiteAction(
  slug: string,
  input: { settings: unknown; menuOrder: string[] },
): Promise<SaveSiteResult> {
  const site = await getSiteBySlug(slug);
  if (!site)
    return { ok: false, message: 'This site no longer exists.', errors: {} };
  const parsed = siteSettingsSchema.safeParse(input.settings);
  const errors: Record<string, string> = {};
  for (const issue of parsed.error?.issues ?? [])
    errors[issue.path.join('.')] ??= issue.message;
  if (
    parsed.success &&
    !contrastColour(parsed.data.brand, undefined, [
      parsed.data.background,
      parsed.data.text,
    ])
  )
    errors.brand =
      'No text colour is readable on this colour. Pick a darker or lighter one.';
  if (!parsed.success || Object.keys(errors).length > 0)
    return {
      ok: false,
      message: 'Not saved: some settings need attention.',
      errors,
    };

  // Only ids of this site's own pages, each once.
  const pageIds = new Set((await listPages(slug)).map((page) => page.id));
  const menuOrder = [...new Set(input.menuOrder)].filter((id) =>
    pageIds.has(id),
  );
  const next = applySettings(site, parsed.data);
  const saved = await updateSite(slug, { ...next, menuOrder });
  return saved
    ? { ok: true, site: saved }
    : { ok: false, message: 'This site no longer exists.', errors: {} };
}

// -------------------------------------------------------- page switcher

/** A site's pages, for the editor's switcher when another site is picked. */
export async function listSitePagesAction(
  siteSlug: string,
): Promise<{ id: string; title: string; path: string }[]> {
  const found = await listPages(siteSlug);
  return found.map(({ id, draft, path }) => ({
    id,
    title: draft.title,
    path,
  }));
}
