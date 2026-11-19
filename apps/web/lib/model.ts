/**
 * Storage model. Sites are seed-owned; pages are portable JSON documents
 * whose component tree only references component `type`s by name, so a
 * page can be rendered by any app that has the same component library.
 */

/** Per-site design tokens. Mapped to CSS variables by `themeToCssVars`. */
export type Theme = {
  brand: string;
  /** Text colour used on top of `brand` backgrounds. */
  onBrand: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
  headingFont: string;
  radius: string;
};

export type NavItem = { label: string; href: string };

export type Site = {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: Theme;
  navigation: NavItem[];
};

/**
 * One node in a page tree. `type` is a key in the component registry and
 * `props` must satisfy that component's schema (checked on save).
 */
export type ComponentInstance = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentInstance[];
};

export type PageDocument = {
  id: string;
  siteId: string;
  path: string;
  title: string;
  /** Bumped when the component tree format changes, so old pages can be migrated. */
  schemaVersion: 1;
  status: 'published';
  components: ComponentInstance[];
  updatedAt: string;
};

export function normalizePath(path: string) {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

export function isValidPagePath(path: string) {
  if (path === '/') return true;
  return path
    .slice(1)
    .split('/')
    .every((segment) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment));
}
