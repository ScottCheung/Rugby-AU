/**
 * Page paths are stored normalised: "/" for home, otherwise a leading slash,
 * lowercase segments and no trailing slash ("/fixtures-and-news").
 */
export function normalizePath(input: string): string {
  const trimmed = input
    .trim()
    .toLowerCase()
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}`;
}

/** Each segment: lowercase letters and numbers, optionally joined by single hyphens. */
export function isValidPath(path: string): boolean {
  if (path === '/') return true;
  return path
    .slice(1)
    .split('/')
    .every((segment) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment));
}

/** Catch-all route segments (undefined for the home page) -> stored path. */
export function pathFromSegments(segments: string[] = []): string {
  return normalizePath(segments.join('/'));
}
