import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, H1, H2, Paragraph } from '@scottcheung/ui';
import { NewPageForm } from '@/components/manager/NewPageForm';
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
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-slate-500">
        <Link href="/manager" className="hover:underline">
          Sites
        </Link>{' '}
        / <span className="text-slate-800">{site.name}</span>
      </nav>
      <div>
        <H1 className="m-0">{site.name}</H1>
        <Paragraph className="mt-1 text-slate-600">
          Pages on this site. Open one to edit its content.
        </Paragraph>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="overflow-x-auto p-0">
          {pages.length === 0 ? (
            <p className="p-6 text-slate-500">
              This site has no pages yet. Create the first one.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Last saved</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">{page.title}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {page.path}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(page.updatedAt).toLocaleString('en-AU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/manager/${site.slug}/pages/${page.id}`}
                          className="sc-ui-button"
                          data-size="sm"
                        >
                          Edit
                        </Link>
                        <a
                          href={`/sites/${site.slug}${page.path === '/' ? '' : page.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="sc-ui-button"
                          data-variant="secondary"
                          data-size="sm"
                        >
                          View live ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <H2 className="m-0 text-lg">New page</H2>
          <NewPageForm action={createPageAction.bind(null, site.slug)} />
        </Card>
      </div>
    </div>
  );
}
