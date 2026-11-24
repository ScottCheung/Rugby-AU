'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import { usePickedColor } from '@/lib/usePickedColor';

/**
 * A card with its text on the photo. The photo's own colour (picked from
 * its bottom, like a person card's) fades up over it and carries the text.
 * On hover only the heading shows until the card is pointed at or focused;
 * then the label, text and button rise in. Styles in app/styles/site/cards.css
 * (.card--overlay).
 */
export function OverlayCard({
  image,
  title,
  kicker,
  text,
  button,
  href,
  color,
  ratio,
  details,
}: {
  image: { url: string; alt: string };
  title: string;
  kicker?: ReactNode;
  text?: ReactNode;
  button?: ReactNode;
  /** The card's address, when it has one and no button carries it. */
  href?: string;
  /** From the server (lib/imageColor.ts); worked out here if missing. */
  color?: string;
  ratio: string;
  details: 'hover' | 'always';
}) {
  const picked = usePickedColor(color || !image.url ? undefined : image.url);
  const shade = color ?? picked ?? '#1f2937';
  const hasMore = !!(text || button);

  return (
    <article
      data-ratio={ratio}
      data-details={details}
      style={{ '--shade': shade } as CSSProperties}
      className={`card card--overlay ${href || button ? 'card-link' : ''}`}
    >
      <div className="card-overlay__photo">
        <Image src={image.url} alt={image.alt} />
      </div>
      <div className="card-overlay__body">
        {kicker && (
          <div className="card-overlay__more">
            <div>{kicker}</div>
          </div>
        )}
        <Heading level={4} className="card__title">
          {href ? (
            <a href={href} className="stretched-link text-inherit no-underline">
              {title}
            </a>
          ) : (
            title
          )}
        </Heading>
        {hasMore && (
          <div className="card-overlay__more">
            <div className="flex flex-col gap-site-xs">
              {text}
              {button}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
