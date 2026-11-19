import type { Metadata } from 'next';
import './globals.css';
import { ThemeShell } from '@/components/theme-shell';

export const metadata: Metadata = {
  title: 'Rugby AU | Site Manager',
  description: 'A simple multi-site content manager for Rugby Australia.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
