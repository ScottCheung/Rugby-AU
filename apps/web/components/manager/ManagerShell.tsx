'use client';

import { LayoutDashboard, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ManagerSidebar } from './ManagerSidebar';
import { ManagerViewProvider, useManagerView } from './ManagerView';
import type { ManagerView } from './sidebarCookie';

/** The compact top bar for phones (no room for a sidebar). */
function TopBar({
  className = '',
  viewSwitch = false,
}: {
  className?: string;
  /** Phones: the sidebar's grid / list switch lives here instead. */
  viewSwitch?: boolean;
}) {
  const { view, setView } = useManagerView();
  return (
    <header
      className={`sticky top-0 z-40 flex h-16 items-center bg-[var(--ui-bg)]/80 px-4 backdrop-blur-xl sm:px-6 ${className}`}
    >
      <Link href="/manager" className="flex items-center gap-2.5 font-bold">
        <span className="grid size-9 place-items-center rounded-full bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)]">
          <LayoutDashboard className="size-4.5" />
        </span>
        Site Manager
      </Link>
      {viewSwitch && (
        <button
          type="button"
          onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          aria-label={view === 'grid' ? 'Show as a list' : 'Show as cards'}
          className="ml-auto grid size-10 place-items-center rounded-full bg-[var(--ui-glass)] text-[var(--ui-muted)]"
        >
          {view === 'grid' ? (
            <List className="size-4" />
          ) : (
            <LayoutGrid className="size-4" />
          )}
        </button>
      )}
    </header>
  );
}

/**
 * Dashboard layout: a sidebar beside the list pages. The page editor has
 * its own top bar and takes the whole window.
 */
export function ManagerShell({
  sidebarCollapsed,
  view,
  children,
}: {
  /** From the sidebar cookie, read on the server. */
  sidebarCollapsed: boolean;
  /** From the view cookie: the global grid / list choice. */
  view: ManagerView;
  children: ReactNode;
}) {
  return (
    <ManagerViewProvider initialView={view}>
      <Shell sidebarCollapsed={sidebarCollapsed}>{children}</Shell>
    </ManagerViewProvider>
  );
}

function Shell({
  sidebarCollapsed,
  children,
}: {
  sidebarCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The page editor has its own top bar and uses the whole window.
  if (pathname.includes('/pages/')) return children;
  return (
    <div className="flex min-h-dvh">
      {/* useSearchParams in the sidebar needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ManagerSidebar initialCollapsed={sidebarCollapsed} />
      </Suspense>
      <div className="min-w-0 flex-1">
        <TopBar className="md:hidden" viewSwitch />
        {children}
      </div>
    </div>
  );
}
