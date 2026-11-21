/**
 * Cookies holding the manager's display choices. A plain module (not
 * 'use client'), so the server layout reads the real strings.
 */
export const SIDEBAR_COOKIE = 'manager-sidebar';
export const VIEW_COOKIE = 'manager-view';

/** How the manager shows lists of sites: cards or compact rows. */
export type ManagerView = 'grid' | 'list';
