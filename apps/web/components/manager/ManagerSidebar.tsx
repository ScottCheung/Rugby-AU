'use client';

import {
  Flag,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  List,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  siteCategories,
  siteCategoryLabels,
  type SiteCategory,
} from '@/lib/types';
import { useManagerView } from './ManagerView';
import { SIDEBAR_COOKIE } from './sidebarCookie';

const categoryIcons: Record<SiteCategory, LucideIcon> = {
  'governing-body': Landmark,
  'national-team': Flag,
  'super-rugby': Trophy,
  'state-union': MapPinned,
};

const spring = { type: 'spring', stiffness: 400, damping: 40 } as const;
const label = {
  hidden: { opacity: 0, x: -10, width: 0 },
  shown: {
    opacity: 1,
    x: 0,
    width: 'auto',
    transition: { delay: 0.05, duration: 0.2 },
  },
  exit: { opacity: 0, x: -10, width: 0, transition: { duration: 0.1 } },
};
/**
 * The manager's sidebar: the brand, All sites and one entry per kind of
 * site (each opens the site list filtered to it). It collapses to icons.
 * The choice is kept in a cookie the server reads, so a page arrives with
 * the sidebar already the right width instead of animating into it.
 */
export function ManagerSidebar({
  initialCollapsed,
}: {
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { view, setView } = useManagerView();
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'open'}; path=/manager; max-age=31536000; samesite=lax`;
  };

  const onList = pathname === '/manager';
  const category = params.get('category');
  const items = [
    {
      href: '/manager',
      name: 'All sites',
      icon: LayoutGrid,
      active: onList && !category,
    },
    ...siteCategories.map((value) => ({
      href: `/manager?category=${value}`,
      name: siteCategoryLabels[value],
      icon: categoryIcons[value],
      active: onList && category === value,
    })),
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 272 }}
      transition={spring}
      className={`sticky top-0 z-20 hidden h-dvh shrink-0 flex-col justify-between overflow-hidden bg-[var(--ui-surface)] md:flex ${collapsed ? 'p-4' : 'p-5'}`}
    >
      <div className="flex min-h-0 flex-col gap-6">
        <Link
          href="/manager"
          className={`flex shrink-0 items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-2'}`}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)] shadow-xs">
            <LayoutDashboard className="size-5" />
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            {!collapsed && (
              <motion.span
                variants={label}
                initial="hidden"
                animate="shown"
                exit="exit"
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-bold">Site Manager</span>
                <span className="text-xs text-[var(--ui-muted)]">
                  One library, every site
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav aria-label="Sites" className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              aria-current={item.active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-full transition-colors ${collapsed ? 'justify-center p-2.5' : 'px-4 py-3'} ${
                item.active
                  ? 'bg-[image:var(--ui-primary-gradient)] font-bold text-[var(--ui-on-primary)] shadow-xs'
                  : 'font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-bg-secondary)] hover:text-[var(--ui-fg)]'
              }`}
            >
              <item.icon className="size-5 shrink-0" />
              <AnimatePresence mode="popLayout" initial={false}>
                {!collapsed && (
                  <motion.span
                    variants={label}
                    initial="hidden"
                    animate="shown"
                    exit="exit"
                    className="overflow-hidden text-sm whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        {/* The global view: every list of sites follows it. */}
        <div
          className={`flex flex-col gap-2 ${collapsed ? 'items-center' : 'px-2'}`}
        >
          {!collapsed && <span className="sc-ui-overline px-2">View</span>}
          {collapsed ? (
            <button
              type="button"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              aria-label={view === 'grid' ? 'Show as a list' : 'Show as cards'}
              title={view === 'grid' ? 'Show as a list' : 'Show as cards'}
              className="grid size-10 place-items-center rounded-full bg-[var(--ui-glass)] text-[var(--ui-muted)] transition-colors hover:text-[var(--ui-fg)]"
            >
              {view === 'grid' ? (
                <List className="size-5" />
              ) : (
                <LayoutGrid className="size-5" />
              )}
            </button>
          ) : (
            <div
              role="group"
              aria-label="View"
              className="grid grid-cols-2 gap-1 rounded-full bg-[var(--ui-glass)] p-1"
            >
              {(
                [
                  ['grid', 'Cards', LayoutGrid],
                  ['list', 'List', List],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    view === value
                      ? 'bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)] shadow-xs'
                      : 'text-[var(--ui-muted)] hover:text-[var(--ui-fg)]'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`flex items-center gap-3 rounded-full text-sm font-medium text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-bg-secondary)] hover:text-[var(--ui-fg)] ${collapsed ? 'justify-center p-2.5' : 'px-4 py-3'}`}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-5 shrink-0" />
        ) : (
          <PanelLeftClose className="size-5 shrink-0" />
        )}
        {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
      </button>
    </motion.aside>
  );
}
