import type { CSSProperties } from 'react';
import { Container } from '@/components/primitives/Container';
import { SiteLogo } from '@/components/primitives/SiteLogo';
import { resolveHref } from '@/lib/links';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { ComponentNode, MenuItem, Site } from '@/lib/types';
import { RenderTree } from './RenderTree';
import { SiteMotion } from './Reveal';
import { SiteHeader } from './SiteHeader';

/**
 * One public page: header, components, footer, in the site's theme. The
 * public route and the editor's preview both draw exactly this, so the
 * preview cannot drift from the live site. No data loading here and no
 * hooks, so it renders on the server (public) and in the browser (preview).
 */
export function SitePage({
  site,
  themeVars,
  title,
  path,
  components,
  menu,
  data,
  editable = false,
  editHref,
  managerHref,
}: {
  site: Site;
  /** themeToCssVars(resolveTheme(...)) for this site. */
  themeVars: CSSProperties;
  title: string;
  path: string;
  components: ComponentNode[];
  /** The site's top-level pages, "/" first. */
  menu: MenuItem[];
  data: SiteData;
  /** The editor's preview: components carry their id for click-to-select. */
  editable?: boolean;
  editHref?: string;
  managerHref?: string;
}) {
  // An edge-to-edge first Section is a hero: the header floats over it.
  const heroFirst = components[0]?.props.width === 'full-width';

  return (
    <div
      style={themeVars}
      className="@container/page flex min-h-screen flex-col bg-background font-site text-[1.0625rem] leading-[1.65] text-text"
    >
      <SiteHeader
        siteName={site.name}
        logoUrl={site.logoUrl}
        homeHref={`/sites/${site.slug}`}
        editHref={editHref}
        managerHref={managerHref}
        overlay={heroFirst}
        button={
          site.headerButton && {
            label: site.headerButton.label,
            href: resolveHref(site.headerButton.href, site.slug) ?? '#',
          }
        }
        chrome={editable}
        links={menu.map((item) => ({
          id: item.id,
          href: resolveHref(item.path, site.slug) ?? '#',
          label: item.title,
          current: item.path === path,
        }))}
      />
      {!heroFirst && <div aria-hidden className="h-16 md:h-[72px]" />}

      {/* No page-wide container: each block decides its width (RenderTree). */}
      <main
        className={`flex flex-1 flex-col pb-site-lg ${
          heroFirst ? '' : 'pt-site-lg'
        }`}
      >
        <h1 className="sr-only">{title}</h1>
        {components.length > 0 ? (
          <>
            {/* Without JavaScript, entrance animations never run: show it all. */}
            <noscript>
              <style>{`main [style*="opacity:0"]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
            </noscript>
            <SiteMotion>
              <RenderTree
                nodes={components}
                siteSlug={site.slug}
                data={data}
                editable={editable}
              />
            </SiteMotion>
          </>
        ) : (
          <Container>
            <p className="text-muted-text">This page has no content yet.</p>
          </Container>
        )}
      </main>

      <footer
        data-site-chrome={editable || undefined}
        className="surface-strong bg-brand py-site-md text-sm text-brand-contrast"
      >
        <Container className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex max-w-sm flex-col gap-3">
              <span className="site-heading flex items-center gap-3 text-lg font-bold">
                <SiteLogo src={site.logoUrl} name={site.name} size="sm" />
                {site.name}
              </span>
              <span className="opacity-80">{site.tagline}</span>
            </div>
            <nav aria-label="Footer">
              <ul className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-2 p-0">
                {menu.map((item) => (
                  <li key={item.id}>
                    <a
                      href={resolveHref(item.path, site.slug)}
                      className="opacity-80 hover:underline hover:opacity-100"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {site.footerLinks && site.footerLinks.length > 0 && (
              <nav aria-label="More links">
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {site.footerLinks.map((link) => (
                    <li key={`${link.label}${link.href}`}>
                      <a
                        href={resolveHref(link.href, site.slug) ?? '#'}
                        className="opacity-80 hover:underline hover:opacity-100"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
          <span className="border-t border-current/20 pt-4 opacity-70">
            © {site.name}. A demo site with sample content.
          </span>
        </Container>
      </footer>
    </div>
  );
}
