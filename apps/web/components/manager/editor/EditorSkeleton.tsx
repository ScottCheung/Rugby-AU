import { Skeleton } from '@scottcheung/ui';

/** The preview's stand-in while its page loads: a spinner over the canvas. */
export function PreviewLoading({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading the preview"
      className={`preview-loading ${className}`}
    >
      <span className="preview-loading__spinner" aria-hidden />
      <span className="preview-loading__label">Loading preview…</span>
    </div>
  );
}

/**
 * The editor's shape (layers, canvas, inspector) shown the moment an Edit
 * link or the page switcher is clicked, while the server reads the page.
 * Same widths as TreePanel and Inspector, so nothing jumps when it arrives.
 */
export function EditorSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden" aria-busy="true">
      <aside className="hidden w-72 shrink-0 flex-col gap-3 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 md:flex">
        <Skeleton height="2.25rem" />
        <Skeleton height="2.25rem" />
        <Skeleton width="4rem" height="0.75rem" className="mt-3" />
        {[90, 75, 82, 60, 70, 85].map((width, index) => (
          <Skeleton
            key={index}
            width={`${width}%`}
            height="1.5rem"
            style={{ marginLeft: index % 3 === 0 ? 0 : '1rem' }}
          />
        ))}
      </aside>
      <main className="relative min-w-0 flex-1 bg-[var(--ui-bg-secondary)]">
        <PreviewLoading className="absolute inset-0" />
      </main>
      <aside className="hidden w-[25rem] shrink-0 flex-col gap-4 border-l border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:flex">
        <Skeleton width="40%" height="1rem" />
        <Skeleton height="2.5rem" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton height="2.5rem" />
          </div>
        ))}
      </aside>
    </div>
  );
}
