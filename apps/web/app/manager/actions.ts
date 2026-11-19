'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTree, type TreeIssue } from '@/lib/components/validateTree';
import { createPage, getPageById, updatePage } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { isValidPath, normalizePath } from '@/lib/paths';
import type { Page } from '@/lib/types';

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

// --------------------------------------------------------------- save page

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
});

export type SavePageResult =
  | { ok: true; page: Page }
  | {
      ok: false;
      message: string;
      pageErrors: { title?: string; description?: string };
      issues: TreeIssue[];
    };

/**
 * Validate the whole page with the component schemas, then write it. The
 * client validates nothing it relies on: this is the only gate to the DB.
 */
export async function savePageAction(
  pageId: string,
  input: { title: string; description: string; tree: unknown },
): Promise<SavePageResult> {
  if (!(await getPageById(pageId)))
    return {
      ok: false,
      message: 'This page no longer exists.',
      pageErrors: {},
      issues: [],
    };

  const settings = pageSettings.safeParse(input);
  const tree = validateTree(input.tree);
  if (!settings.success || !tree.ok) {
    const pageErrors: { title?: string; description?: string } = {};
    for (const issue of settings.error?.issues ?? []) {
      const key = issue.path[0];
      if (key === 'title' || key === 'description')
        pageErrors[key] = issue.message;
    }
    const issues = tree.ok ? [] : tree.issues;
    const count = issues.length + Object.keys(pageErrors).length;
    return {
      ok: false,
      message: `Not saved: ${count} ${count === 1 ? 'field needs' : 'fields need'} attention.`,
      pageErrors,
      issues,
    };
  }

  const page = await updatePage(pageId, {
    title: settings.data.title,
    description: settings.data.description || undefined,
    tree: tree.tree,
  });
  if (!page)
    return {
      ok: false,
      message: 'This page no longer exists.',
      pageErrors: {},
      issues: [],
    };
  return { ok: true, page };
}
