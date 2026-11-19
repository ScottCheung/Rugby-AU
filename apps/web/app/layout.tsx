import type { Metadata } from 'next';
import '@scottcheung/ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rugby AU | Site Manager',
  description: 'A simple multi-site content manager for Rugby Australia.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
