import { FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { EditorLink } from './editor/EditorLink';
import { collectionIds, collections } from '@/lib/collections';
import { collectionIcons } from './editor/componentIcons';

/**
 * The site's own areas: its pages, and (in the editor, on the home page)
 * its content and settings. Server component: every tab is a link.
 */
export function SiteTabs({
  siteSlug,
  active,
  homeId,
}: {
  siteSlug: string;
  active: 'pages';
  /** The home page's id: news, players and settings open in its editor. */
  homeId?: string;
}) {
  const editor = (panel: string) =>
    homeId ? `/manager/${siteSlug}/pages/${homeId}?panel=${panel}` : undefined;
  const tabs = [
    {
      id: 'pages',
      label: 'Pages',
      href: `/manager/${siteSlug}`,
      Icon: FileText,
    },
    ...collectionIds.map((id) => ({
      id,
      label: collections[id].label,
      href: editor(id),
      Icon: collectionIcons[id],
    })),
    { id: 'site', label: 'Settings', href: editor('site'), Icon: Settings },
  ].filter((tab): tab is typeof tab & { href: string } => !!tab.href);
  const item =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition';
  return (
    <nav
      aria-label="Site"
      className="flex flex-wrap gap-1 rounded-full bg-[var(--ui-glass)] p-1"
    >
      {tabs.map(({ id, label, href, Icon }) => {
        // Every tab but Pages opens the editor.
        const TabLink = id === 'pages' ? Link : EditorLink;
        return (
          <TabLink
            key={id}
            href={href}
            aria-current={id === active ? 'page' : undefined}
            className={`${item} ${
              id === active
                ? 'bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]'
                : 'text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
            }`}
          >
            <Icon className="size-4" /> {label}
          </TabLink>
        );
      })}
    </nav>
  );
}
