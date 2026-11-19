import {
  ChevronLeft,
  ExternalLink,
  FileText,
  House,
  PencilLine,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, H1, Paragraph } from '@scottcheung/ui';
import { NewPageForm } from '@/components/manager/NewPageForm';
import { PageContainer } from '@/components/manager/PageContainer';
import { listPages } from '@/lib/db/pages';
import { getSiteBySlug } from '@/lib/db/sites';
import { createPageAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function SitePages({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const site = await getSiteBySlug(siteSlug);
  if (!site) notFound();
  const pages = await listPages(site.slug);

  return (
    <PageContainer>
      <div>
        <Link
          href="/manager"
          className="inline-flex items-center gap-1 text-sm text-[var(--ui-muted)] hover:text-[var(--ui-primary)]"
        >
          <ChevronLeft className="size-4" /> All sites
        </Link>
        <H1 className="mt-2">{site.name}</H1>
        <Paragraph className="mt-1">
          Open a page to edit it visually, or create a new one.
        </Paragraph>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="flex flex-col gap-2 p-3">
          <span className="sc-ui-overline px-3 pt-2">
            Pages · {pages.length}
          </span>
          {pages.length === 0 ? (
            <p className="m-0 px-3 py-6 text-sm text-[var(--ui-muted)]">
              This site has no pages yet. Create the first one.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {pages.map((page) => {
                const Icon = page.path === '/' ? House : FileText;
                return (
                  <li
                    key={page.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[var(--ui-glass)]"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-[var(--ui-glass)] text-[var(--ui-primary)]">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate font-semibold">{page.title}</p>
                      <p className="m-0 truncate text-xs text-[var(--ui-muted)]">
                        <span className="font-mono">{page.path}</span> · saved{' '}
                        {new Date(page.updatedAt).toLocaleString('en-AU', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <Link
                      href={`/manager/${site.slug}/pages/${page.id}`}
                      className="sc-ui-button"
                      data-size="sm"
                    >
                      <PencilLine /> Edit
                    </Link>
                    <a
                      href={`/sites/${site.slug}${page.path === '/' ? '' : page.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="sc-ui-button"
                      data-variant="secondary"
                      data-size="sm"
                    >
                      View live <ExternalLink />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <span className="sc-ui-overline">New page</span>
            <p className="m-0 mt-1 text-sm text-[var(--ui-muted)]">
              It opens in the editor once created.
            </p>
          </div>
          <NewPageForm action={createPageAction.bind(null, site.slug)} />
        </Card>
      </div>
    </PageContainer>
  );
}
