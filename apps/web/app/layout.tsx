import type { Metadata } from 'next';
// The fonts site themes can choose from (lib/theme/fonts.ts).
import '@fontsource-variable/inter';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/oswald';
import '@fontsource-variable/nunito';
import '@fontsource/barlow-condensed/700.css';
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
