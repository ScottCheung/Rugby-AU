'use client';

import Link, { useLinkStatus } from 'next/link';
import { useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { EditorSkeleton } from './EditorSkeleton';

/**
 * The editor's skeleton over the whole window while a link is pending.
 * Portalled into the manager's theme element (for its colour tokens).
 */
export function EditorPendingOverlay({ show }: { show: boolean }) {
  const [host, setHost] = useState<Element | null>(null);
  return (
    <span
      hidden
      ref={(node) =>
        setHost(
          node?.closest('.sc-ui-theme') ?? node?.ownerDocument.body ?? null,
        )
      }
    >
      {show &&
        host &&
        createPortal(
          // A portal's clicks bubble to the link in React: keep them here.
          <div
            className="fixed inset-0 z-[60] bg-[var(--ui-bg)]"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <EditorSkeleton />
          </div>,
          host,
        )}
    </span>
  );
}

function Pending() {
  const { pending } = useLinkStatus();
  return <EditorPendingOverlay show={pending} />;
}

/**
 * A link into the page editor. The editor's shape shows in the same frame
 * as the click, before the server has answered, so opening it never feels
 * stuck; the route's loading.tsx (the same skeleton) then takes over.
 */
export function EditorLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <Pending />
    </Link>
  );
}
