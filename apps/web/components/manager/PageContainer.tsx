import type { ReactNode } from 'react';

/** Centred content for the manager's list pages (the editor uses the full width). */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-4 pb-12 sm:px-6">
      {children}
    </div>
  );
}
