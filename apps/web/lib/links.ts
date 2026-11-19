/**
 * Page JSON stores site-relative links ("/about") so pages stay portable.
 * Public sites are served under /sites/<slug>, so relative links get that
 * prefix. Full http(s) and #anchor links pass through; anything else
 * (for example "javascript:") is dropped.
 */
export function resolveHref(
  href: string,
  siteSlug: string,
): string | undefined {
  if (/^https?:\/\//i.test(href) || href.startsWith('#')) return href;
  if (href === '/') return `/sites/${siteSlug}`;
  if (href.startsWith('/')) return `/sites/${siteSlug}${href}`;
  return undefined;
}
