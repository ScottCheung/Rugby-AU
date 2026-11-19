import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@scottcheung/ui';
import { ManagerProviders } from '@/components/manager/ManagerProviders';

export const metadata: Metadata = { title: 'Site Manager' };

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      brand="green"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <ManagerProviders>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link href="/manager" className="flex items-center gap-2 font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--ui-primary)] text-sm text-white">
                SM
              </span>
              Site Manager
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </ManagerProviders>
    </ThemeProvider>
  );
}
