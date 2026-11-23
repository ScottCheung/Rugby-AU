'use client';

import { LayoutGrid, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ease } from '@scottcheung/ui/motion';
import { useScrollFade } from '../useScrollFade';
import { listSitePagesAction } from '@/app/manager/actions';

export type SwitcherSite = { slug: string; name: string; logoUrl?: string };
export type SwitcherPage = { id: string; title: string; path: string };

/**
 * One button for "where am I": it opens a dialog of cards to switch the
 * site or the page. The button and the dialog share a Motion `layoutId`,
 * so the dialog grows out of the button and shrinks back into it. The
 * dialog is portalled out of the toolbar (which is transformed, and would
 * pin its fixed-position children to itself) into the manager's theme
 * element, so it keeps the design system's colour tokens. Styles:
 * .page-switcher in app/manager/manager.css.
 */
export function PageSwitcher({
  sites,
  siteSlug,
  pages,
  pageId,
  onNavigate,
}: {
  sites: SwitcherSite[];
  siteSlug: string;
  pages: SwitcherPage[];
  pageId: string;
  /** Leave for another site or page; the editor asks first if unsaved. */
  onNavigate: (href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    attach: fadeRef,
    className: fadeClass,
    style: fadeStyle,
  } = useScrollFade<HTMLDivElement>('y');
  // The site whose pages are listed: only a filter, until a page is picked.
  const [browsing, setBrowsing] = useState(siteSlug);
  // Pages of the sites looked at so far; the current site's are given.
  const [loaded, setLoaded] = useState<Record<string, SwitcherPage[]>>({});
  const layoutId = useId();
  const titleId = useId();
  // Where the dialog is portalled to: the element holding the ui tokens.
  const [host, setHost] = useState<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const browse = (slug: string) => {
    setBrowsing(slug);
    if (slug === siteSlug || loaded[slug]) return;
    listSitePagesAction(slug).then((list) =>
      setLoaded((current) => ({ ...current, [slug]: list })),
    );
  };
  const openSwitcher = () => {
    setBrowsing(siteSlug);
    setOpen(true);
  };
  const shown = browsing === siteSlug ? pages : loaded[browsing];
  const siteName = sites.find((site) => site.slug === browsing)?.name;

  return (
    <>
      {/* The slot keeps its size while the button is out being the dialog. */}
      <span
        className="page-switcher__slot"
        ref={(node) =>
          setHost(
            node?.closest('.sc-ui-theme') ?? node?.ownerDocument.body ?? null,
          )
        }
      >
        {!open && (
          <motion.button
            type="button"
            layoutId={layoutId}
            transition={{ duration: 0.4, ease }}
            style={{ borderRadius: 999 }}
            className="page-switcher__trigger"
            aria-label="Switch site or page"
            title="Switch site or page"
            aria-haspopup="dialog"
            onClick={openSwitcher}
          >
            <LayoutGrid />
          </motion.button>
        )}
      </span>

      {host &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="backdrop"
                className="page-switcher__backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setOpen(false);
                }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  layoutId={layoutId}
                  transition={{ duration: 0.4, ease }}
                  style={{ borderRadius: 28 }}
                  className="page-switcher__panel"
                >
                  <motion.div
                    // The fade is on the scroller inside the panel: on the
                    // panel itself it would fade its background away too.
                    ref={fadeRef}
                    style={fadeStyle}
                    className={`page-switcher__content ${fadeClass}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.18 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <header className="page-switcher__header">
                      <h2 id={titleId}>Switch site or page</h2>
                      <button
                        type="button"
                        className="page-switcher__close"
                        aria-label="Close"
                        onClick={() => setOpen(false)}
                      >
                        <X />
                      </button>
                    </header>

                    <section aria-label="Sites">
                      <h3 className="page-switcher__heading">Sites</h3>
                      <ul className="page-switcher__grid page-switcher__grid--sites">
                        {sites.map((site) => (
                          <li key={site.slug}>
                            <button
                              type="button"
                              className="page-switcher__card page-switcher__card--site"
                              aria-current={
                                site.slug === browsing ? 'true' : undefined
                              }
                              onClick={() => browse(site.slug)}
                            >
                              <span className="page-switcher__logo">
                                {site.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={site.logoUrl} alt="" />
                                ) : (
                                  site.name.slice(0, 1).toUpperCase()
                                )}
                              </span>
                              <strong className="page-switcher__site-name">
                                {site.name}
                              </strong>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section aria-label="Pages">
                      <h3 className="page-switcher__heading">
                        Pages{siteName ? ` · ${siteName}` : ''}
                      </h3>
                      {shown ? (
                        <ul className="page-switcher__grid">
                          {shown.map((page) => (
                            <li key={page.id}>
                              <button
                                type="button"
                                className="page-switcher__card"
                                // Its editor's loading state is ready by the click.
                                onPointerEnter={() =>
                                  router.prefetch(
                                    `/manager/${browsing}/pages/${page.id}`,
                                  )
                                }
                                aria-current={
                                  browsing === siteSlug && page.id === pageId
                                    ? 'true'
                                    : undefined
                                }
                                onClick={() => {
                                  setOpen(false);
                                  if (
                                    browsing !== siteSlug ||
                                    page.id !== pageId
                                  )
                                    onNavigate(
                                      `/manager/${browsing}/pages/${page.id}`,
                                    );
                                }}
                              >
                                <span className="page-switcher__text">
                                  <strong>{page.title}</strong>
                                  <small>{page.path}</small>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="page-switcher__empty">Loading…</p>
                      )}
                    </section>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          host,
        )}
    </>
  );
}
