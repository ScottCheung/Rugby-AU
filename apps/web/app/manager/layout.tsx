import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { ThemeProvider } from '@scottcheung/ui';
import { ManagerProviders } from '@/components/manager/ManagerProviders';

export const metadata: Metadata = { title: 'Site Manager' };

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      brand="green"
      className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-fg)]"
    >
      <ManagerProviders>
        <header className="sticky top-0 z-40 flex h-16 items-center bg-[var(--ui-bg)]/80 px-4 backdrop-blur-xl sm:px-6">
          <Link href="/manager" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-full bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)]">
              <LayoutDashboard className="size-4.5" />
            </span>
            Site Manager
          </Link>
        </header>
        {children}
      </ManagerProviders>
    </ThemeProvider>
  );
}
