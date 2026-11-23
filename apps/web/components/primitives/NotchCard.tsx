import type { CSSProperties, ReactNode } from 'react';

/**
 * A card with a tab: the title sits on a tab joined to the card by a curved
 * notch, and a small piece (a status, a date) can sit at the other end of
 * the tab row. The same shape as the manager's NotchCard, drawn here with
 * the site's own tokens (radius, spacing, colours) because public pages do
 * not load the manager's stylesheet. Styles: .site-notch in app/styles/site/cards.css.
 */
export function NotchCard({
  title,
  aside,
  asideTone,
  className = '',
  children,
}: {
  title: ReactNode;
  /** In the filled corner beside the tab, centred (e.g. a status). */
  aside?: ReactNode;
  /** A colour that tints that corner. Without one it matches the card. */
  asideTone?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`site-notch ${className}`}
      style={
        asideTone
          ? ({
              '--notch-aside-bg': `color-mix(in oklch, ${asideTone} 22%, var(--notch-bg))`,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="site-notch__row">
        <div className="site-notch__tab-wrap">
          <div className="site-notch__tab">
            <span>{title}</span>
          </div>
          <svg
            className="site-notch__curve"
            viewBox="0 0 60 42"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0 0H7.0783C14.772 0 21.7836 4.4132 25.111 11.3501L33.8889 29.6498C37.2164 36.5868 44.228 41 51.9217 41H60V42H0V0Z" />
          </svg>
        </div>
        {aside !== undefined && (
          <div className="site-notch__aside">{aside}</div>
        )}
      </div>
      <div className="site-notch__body">{children}</div>
    </article>
  );
}
