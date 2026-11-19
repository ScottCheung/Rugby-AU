import Link from 'next/link';
import { Manager } from '@/components/manager';
import { getPages, getSites } from '@/lib/repository';

export const dynamic = 'force-dynamic';

async function loadWorkspace() {
  try {
    const [sites, pages] = await Promise.all([getSites(), getPages()]);
    return { sites, pages };
  } catch {
    return null;
  }
}

export default async function ManagerPage() {
  const workspace = await loadWorkspace();
  if (workspace)
    return (
      <Manager initialSites={workspace.sites} initialPages={workspace.pages} />
    );

  return (
    <main className="manager-unavailable">
      <div className="notice-icon">!</div>
      <p className="eyebrow">Local database is offline</p>
      <h1>Start the workspace</h1>
      <p>
        Run the Docker command in the README, then refresh this page. MongoDB
        will be seeded with both sample sites and their pages.
      </p>
      <Link className="button button-dark" href="/manager">
        Refresh manager <span>↗</span>
      </Link>
    </main>
  );
}
