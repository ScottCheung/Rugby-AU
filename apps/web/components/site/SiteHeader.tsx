'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/primitives/Container';
import { SiteLogo } from '@/components/primitives/SiteLogo';

export type HeaderLink = {
  id: string;
  href: string;
  label: string;
  current: boolean;
};

/** Header height: h-16 on phones, md:h-[72px] on desktop (see page spacer). */
const HEADER_PX = 72;
/** How far (px) before the hero ends the header background starts to fill in. */
const FADE_PX = 120;
/** Scrolling past this shows the back-to-top button (when scrolling up). */
const TOP_BUTTON_PX = 400;
/** Development buttons: hidden until the navbar is hovered, never in the flow. */
const devButton =
  'absolute top-full mt-2 hidden rounded-full border border-current/50 bg-brand px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap uppercase text-brand-contrast opacity-0 transition-opacity group-hover:opacity-100 md:block';

/**
 * overlay: the first block is a full-width hero, so the header starts
 * transparent over it and fills in with the brand colour as the hero ends.
 * Without a hero the header is always solid.
 */
export function SiteHeader({
  siteName,
  logoUrl,
  homeHref,
  links,
  overlay,
  editHref,
  managerHref,
  button,
  chrome = false,
}: {
  siteName: string;
  logoUrl?: string;
  homeHref: string;
  links: HeaderLink[];
  overlay: boolean;
  /** Development only: opens this page in the manager's editor. */
  editHref?: string;
  /** Development only: back to the Sites Manager Center. */
  managerHref?: string;
  /** The site's call to action at the end of the bar, e.g. "Buy tickets". */
  button?: { label: string; href: string };
  /** In the editor's preview: a click on the header selects the site. */
  chrome?: boolean;
}) {
  const [progress, setProgress] = useState(overlay ? 0 : 1);
  const [hidden, setHidden] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(false);
  const [atTopArea, setAtTopArea] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;
    let up = false;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      // Ignore tiny jitters so the header does not flicker.
      if (Math.abs(delta) > 2) up = delta < 0;

      let next = 1;
      if (overlay) {
        const main = document.querySelector('main');
        let hero = main
          ? (Array.from(main.children).find(
              (el) => el.tagName !== 'H1' && el.tagName !== 'NOSCRIPT',
            ) as HTMLElement | undefined)
          : undefined;
        // The editor's preview marks each block with a display: contents
        // wrapper, which has no box: measure what it wraps.
        while (hero && getComputedStyle(hero).display === 'contents')
          hero = (hero.firstElementChild as HTMLElement | null) ?? undefined;
        const heroBottom = hero
          ? hero.getBoundingClientRect().bottom + y
          : window.innerHeight * 0.6;
        const start = heroBottom - HEADER_PX - FADE_PX;
        next = Math.min(1, Math.max(0, (y - start) / FADE_PX));
      }

      setProgress(next);
      setHidden(y > HEADER_PX && !up);
      setScrollingUp(up);
      setAtTopArea(y > TOP_BUTTON_PX);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [overlay]);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Hide-on-scroll only applies once the header is fully solid. While it is
  // still transparent over the hero, it stays put.
  const showHeader = progress < 1 || !hidden || menuOpen;
  const showTop = atTopArea && scrollingUp;

  // Colours are mixed by progress: over the hero the text is white, once the
  // header is solid it takes the theme's brand-contrast colour.
  const barStyle = {
    backgroundColor: `color-mix(in srgb, var(--color-brand) ${progress * 100}%, transparent)`,
    color: `color-mix(in srgb, var(--color-brand-contrast) ${progress * 100}%, var(--header-text, #fff))`,
    boxShadow: `0 6px 20px rgba(0,0,0,${0.15 * progress})`,
    transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
  } as const;

  return (
    <>
      <header
        data-site-chrome={chrome || undefined}
        className="group fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out"
        style={barStyle}
      >
        <Container className="relative flex h-16 items-center justify-between gap-4 md:h-[72px] md:gap-6">
          <a
            href={homeHref}
            aria-label={siteName}
            className="site-heading flex shrink-0 items-center text-[inherit]"
            style={{ color: 'inherit' }}
          >
            <SiteLogo src={logoUrl} name={siteName} />
          </a>

          <nav
            aria-label="Main"
            className="no-scrollbar -mx-2 hidden max-w-full overflow-x-auto md:block"
          >
            <ul className="m-0 flex list-none gap-2 p-0 whitespace-nowrap">
              {links.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={`block rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                      item.current
                        ? 'bg-brand-contrast text-brand'
                        : 'hover:bg-brand-contrast/15'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {button && (
            <a
              href={button.href}
              className="ml-auto shrink-0 rounded-full bg-brand-contrast px-4 py-2 text-sm font-semibold whitespace-nowrap text-brand transition-opacity hover:opacity-90 md:ml-0"
            >
              {button.label}
            </a>
          )}

          {/* Development only (see the site page). Absolutely placed under the
              bar and shown when the navbar is hovered, so they never change the layout. */}
          {managerHref && (
            <a href={managerHref} className={devButton + ' left-4'}>
              Sites Manager Center
            </a>
          )}
          {editHref && (
            <a href={editHref} className={devButton + ' right-4'}>
              Edit
            </a>
          )}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 shrink-0 place-items-center rounded-full md:hidden"
          >
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-6 rounded bg-current transition-transform duration-300 ${
                  menuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] block h-0.5 w-6 rounded bg-current transition-opacity duration-300 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] block h-0.5 w-6 rounded bg-current transition-transform duration-300 ${
                  menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </Container>

        {/* Phone menu: a solid panel under the bar, so it reads on any hero. */}
        <nav
          id="site-menu"
          aria-label="Main mobile"
          hidden={!menuOpen}
          className="absolute inset-x-0 top-full border-t border-current/20 bg-brand text-brand-contrast shadow-lg md:hidden"
          style={{ color: 'var(--color-brand-contrast)' }}
        >
          <Container className="py-3">
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {links.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-3 py-3 text-base font-semibold ${
                      item.current ? 'bg-brand-contrast text-brand' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      </header>

      {/* Aligned to the content column's right edge, not the viewport's. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 md:bottom-10">
        <Container className="flex justify-end">
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="grid size-12 place-items-center rounded-full bg-brand text-brand-contrast shadow-lg transition-all duration-300"
            style={{
              opacity: showTop ? 1 : 0,
              transform: showTop ? 'translateY(0)' : 'translateY(16px)',
              pointerEvents: showTop ? 'auto' : 'none',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </Container>
      </div>
    </>
  );
}
