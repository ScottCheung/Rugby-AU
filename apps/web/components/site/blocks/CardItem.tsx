import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import { resolveHref } from '@/lib/links';
import { OverlayCard } from './OverlayCard';
import type { ItemProps } from './types';

/**
 * One card: the photo above the text, or the text on the photo. It fills
 * its cell; in a wide cell (a one-per-row list) the photo sits beside the
 * text (app/styles/site/cards.css, .card).
 */
export function CardItem({ item, style, siteSlug }: ItemProps<'cards'>) {
  const href = item.link && resolveHref(item.link.href, siteSlug);
  const text = style.showText ? item.text : undefined;
  const showButton = style.showButton !== false;
  const kicker = style.showLabel !== false && item.eyebrow && (
    <p className="card__kicker m-0 text-xs font-semibold tracking-wide uppercase opacity-70">
      {item.eyebrow}
    </p>
  );
  const button = showButton && item.link && href && (
    // mt-auto keeps buttons on one line across a row of cards; the button
    // sits in the bottom-right corner, out of the text's way.
    <div className="mt-auto flex w-full justify-end pt-2">
      <Button href={href} stretched>
        {item.link.label}
      </Button>
    </div>
  );
  const image = item.image ?? { url: '', alt: '' };

  // Text on the photo, in the photo's own colour (OverlayCard).
  if (style.look === 'overlay')
    return (
      <OverlayCard
        image={image}
        title={item.title ?? ''}
        kicker={kicker || undefined}
        text={
          text ? (
            <p className="card__text m-0 text-[0.9375rem] leading-relaxed opacity-85">
              {text}
            </p>
          ) : undefined
        }
        button={button || undefined}
        href={!button && href ? href : undefined}
        color={item.tint}
        ratio={style.ratio}
        details={style.details ?? 'hover'}
      />
    );

  return (
    <article
      data-ratio={style.ratio}
      // relative: a card's link stretches over the whole card.
      className={`card relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-muted-text/20 bg-background text-text shadow-sm ${href ? 'card-link' : ''}`}
    >
      <div className="media-card overflow-hidden bg-surface-light">
        <Image src={image.url} alt={image.alt} />
      </div>
      <div className="card__body flex flex-1 flex-col items-start gap-site-xs p-[var(--pad-card)]">
        {kicker}
        <Heading level={4} className="card__title">
          {!button && href ? (
            <a href={href} className="stretched-link text-inherit no-underline">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </Heading>
        {text && (
          <p className="card__text m-0 text-[0.9375rem] leading-relaxed text-muted-text">
            {text}
          </p>
        )}
        {button}
      </div>
    </article>
  );
}
