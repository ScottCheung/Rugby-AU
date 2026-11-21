import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@scottcheung/ui';
import { ManagerProviders } from '@/components/manager/ManagerProviders';
import { ManagerShell } from '@/components/manager/ManagerShell';
import {
  SIDEBAR_COOKIE,
  VIEW_COOKIE,
} from '@/components/manager/sidebarCookie';

export const metadata: Metadata = { title: 'Site Manager' };

export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  const collapsed = store.get(SIDEBAR_COOKIE)?.value === 'collapsed';
  const view = store.get(VIEW_COOKIE)?.value === 'list' ? 'list' : 'grid';
  return (
    <ThemeProvider
      brand="green"
      className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-fg)]"
    >
      <ManagerProviders>
        <ManagerShell sidebarCollapsed={collapsed} view={view}>
          {children}
        </ManagerShell>
      </ManagerProviders>
    </ThemeProvider>
  );
}
