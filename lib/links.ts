/**
 * Editors write site-relative links ("/about"). Public sites are served under
 * /s/<slug>, so relative links are prefixed; absolute and anchor links pass
 * through. Anything else is treated as unsafe and dropped.
 */
export function resolveSiteHref(href: string, siteSlug: string) {
  if (href.startsWith('#')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (href === '/') return `/s/${siteSlug}`;
  if (href.startsWith('/')) return `/s/${siteSlug}${href}`;
  if (/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(href)) return `/s/${siteSlug}/${href}`;
  return undefined;
}
