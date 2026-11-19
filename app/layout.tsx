import type { Metadata } from 'next';
import './globals.css';
import { ThemeShell } from '@/components/theme-shell';

export const metadata: Metadata = { title: 'Rugby Site Manager', description: 'Rugby Australia site management foundation.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ThemeShell>{children}</ThemeShell></body></html>;
}
