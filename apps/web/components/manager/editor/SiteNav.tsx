'use client';

import { Settings } from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import {
  collectionIds,
  collections,
  type CollectionId,
} from '@/lib/collections';
import { collectionIcons } from './componentIcons';

export type SiteNavTarget = 'site' | CollectionId;

/**
 * The top of the left panel: what belongs to the whole site rather than
 * this page. Its settings, and its collections (News, Players), whose
 * entries any page can show. Each opens in the same right panel as the
 * page's blocks.
 */
export function SiteNav({
  current,
  counts,
  onSelect,
}: {
  /** What the right panel shows now, if it is one of these. */
  current: SiteNavTarget | null;
  counts: Record<CollectionId, number>;
  onSelect: (target: SiteNavTarget) => void;
}) {
  const row = (
    target: SiteNavTarget,
    icon: ReactNode,
    label: string,
    count?: number,
  ) => {
    const selected = current === target;
    return (
      <li key={target}>
        <button
          type="button"
          aria-current={selected || undefined}
          onClick={() => onSelect(target)}
          className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[0.8125rem] font-medium transition-colors ${
            selected
              ? 'bg-[var(--ui-primary-soft)] text-[var(--ui-primary)]'
              : 'hover:bg-[var(--ui-glass)]'
          }`}
        >
          <span className="size-4 shrink-0 text-[var(--ui-muted)] [&_svg]:size-4">
            {icon}
          </span>
          <span className="flex-1 truncate">{label}</span>
          {count !== undefined && (
            <span className="text-xs text-[var(--ui-muted)] tabular-nums">
              {count}
            </span>
          )}
        </button>
      </li>
    );
  };
  return (
    <nav
      aria-label="Site"
      className="border-b border-[var(--ui-border)] px-2 pt-3 pb-2"
    >
      <span className="sc-ui-overline block px-1 pb-1">Site</span>
      <ul className="m-0 list-none p-0">
        {row('site', <Settings />, 'Site settings')}
        {collectionIds.map((id) =>
          row(
            id,
            createElement(collectionIcons[id]),
            collections[id].label,
            counts[id],
          ),
        )}
      </ul>
    </nav>
  );
}
