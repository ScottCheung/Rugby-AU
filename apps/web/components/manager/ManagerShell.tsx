'use client';

import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ManagerSidebar } from './ManagerSidebar';

/** The compact top bar: the page editor, and phones (no room for a sidebar). */
function TopBar({ className = '' }: { className?: string }) {
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
    </header>
  );
}

/**
 * Dashboard layout: a sidebar beside the list pages. The page editor keeps
 * the full width under a top bar (its height is worked out from that bar).
 */
export function ManagerShell({
  sidebarCollapsed,
  children,
}: {
  /** From the sidebar cookie, read on the server. */
  sidebarCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.includes('/pages/'))
    return (
      <>
        <TopBar />
        {children}
      </>
    );
  return (
    <div className="flex min-h-dvh">
      {/* useSearchParams in the sidebar needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ManagerSidebar initialCollapsed={sidebarCollapsed} />
      </Suspense>
      <div className="min-w-0 flex-1">
        <TopBar className="md:hidden" />
        {children}
      </div>
    </div>
  );
}
