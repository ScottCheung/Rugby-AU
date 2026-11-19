'use client';
import * as React from 'react';
import Link from 'next/link';
import { ThemeProvider } from '@scottcheung/ui';
import { Button } from '@scottcheung/ui/client';

type Mode = 'light' | 'dark';
function getMode(): Mode {
  return window.localStorage.getItem('starter-theme') === 'dark' ? 'dark' : 'light';
}
function getServerMode(): Mode { return 'light'; }
function subscribeToMode(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('starter-theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('starter-theme-change', callback);
  };
}

export function ThemeShell({ children }: { children: React.ReactNode }) {
  const mode = React.useSyncExternalStore(subscribeToMode, getMode, getServerMode);
  function toggleTheme() {
    window.localStorage.setItem('starter-theme', mode === 'light' ? 'dark' : 'light');
    window.dispatchEvent(new Event('starter-theme-change'));
  }
  return <ThemeProvider mode={mode} className="starter-shell">
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="starter-sidebar border-b border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 md:min-h-screen md:border-b-0 md:border-r">
        <Link href="/" className="text-lg font-bold tracking-tight">Rugby Site Manager</Link>
        <nav aria-label="Main navigation" className="mt-8 grid gap-2">
          <Link className="rounded-xl px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5" href="/">Overview</Link>
          <Link className="rounded-xl px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5" href="/showcase">UI Showcase</Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 md:px-8">
          <span className="text-sm text-[var(--ui-muted)]">Workspace</span>
          <Button variant="secondary" size="sm" onClick={toggleTheme} aria-label="Toggle light and dark theme">{mode === 'light' ? 'Dark mode' : 'Light mode'}</Button>
        </header>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  </ThemeProvider>;
}
