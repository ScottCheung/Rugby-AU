import type { ReactNode } from 'react';
import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';
import { Carousel } from './Carousel';
import { stagger } from '@scottcheung/ui/motion';
import { Lightbox, LightboxThumb } from './Lightbox';
import { Reveal } from './Reveal';

type Props = PropsOf<'cardGrid'> & { siteSlug: string };
type Variant = Props['variant'];
type CardData = Props['cards'][number];

/**
 * One set of cards, several presentations chosen by the `variant` prop.
 * The arrangement classes (cards-*) are plain CSS with container queries
 * in app/globals.css, so they follow the space the grid really has.
 */
export function CardGrid({ title, variant = 'grid', cards, siteSlug }: Props) {
  const items = cards.map((card, index) => (
    <Card
      key={index}
      index={index}
      card={card}
      siteSlug={siteSlug}
      variant={variant}
    />
  ));

  let body: ReactNode;
  if (variant === 'carousel')
    body = <Carousel label={title || 'Cards'}>{items}</Carousel>;
  else if (variant === 'masonry')
    // Photos without a link open full size.
    body = (
      <Lightbox
        photos={cards.map((card) => ({
          url: card.image.url,
          alt: card.image.alt,
          caption: card.heading,
        }))}
      >
        <div className="cards-masonry">{items}</div>
      </Lightbox>
    );
  else body = <div className={`cards-${variant}`}>{items}</div>;

  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {body}
    </div>
  );
}

const cardShape: Record<Variant, string> = {
  grid: '',
  list: '',
  featured: '',
  overlay: '',
  carousel: 'w-4/5 shrink-0 snap-start @md:w-5/12 @3xl:w-1/3',
  masonry: 'mb-site-sm break-inside-avoid',
};

/** One card. Also used by Latest news, which adds an `eyebrow` line. */
export function Card({
  card,
  index,
  siteSlug,
  variant,
  eyebrow,
}: {
  card: CardData;
  index: number;
  siteSlug: string;
  variant: Variant;
  /** A small line above the heading, e.g. "History · 12 November 2026". */
  eyebrow?: string;
}) {
  const kicker = eyebrow && (
    <p className="m-0 text-xs font-semibold tracking-wide uppercase opacity-70">
      {eyebrow}
    </p>
  );
  const href = card.link && resolveHref(card.link.href, siteSlug);
  const button = card.link && href && (
    // mt-auto keeps buttons on one line across a row of cards.
    <div className="mt-auto pt-2">
      <Button href={href} stretched>
        {card.link.label}
      </Button>
    </div>
  );

  // Text over the photo, darkened at the bottom so it stays readable.
  if (variant === 'overlay')
    return (
      <Reveal
        as="article"
        delay={stagger(index)}
        className={`relative flex min-h-80 flex-col justify-end overflow-hidden rounded-site text-white shadow-sm ${href ? 'card-link' : ''}`}
      >
        <div className="absolute inset-0">
          <Image src={card.image.url} alt={card.image.alt} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="relative flex flex-col items-start gap-2 p-site-sm">
          {kicker}
          <Heading level={3}>{card.heading}</Heading>
          {card.text && (
            <p className="m-0 leading-relaxed text-white/85">{card.text}</p>
          )}
          {button}
        </div>
      </Reveal>
    );

  const media =
    variant === 'masonry' && !href ? (
      // Grows into the full-size viewer when clicked (shared layoutId).
      <LightboxThumb index={index} label={`View photo: ${card.heading}`}>
        <Image src={card.image.url} alt={card.image.alt} fit="natural" />
      </LightboxThumb>
    ) : variant === 'masonry' ? (
      <Image src={card.image.url} alt={card.image.alt} fit="natural" />
    ) : (
      <div className="media-card overflow-hidden bg-surface-light">
        <Image src={card.image.url} alt={card.image.alt} />
      </div>
    );

  return (
    <Reveal
      as="article"
      delay={stagger(index)}
      // relative: a card's link stretches over the whole card.
      className={`relative flex flex-col overflow-hidden rounded-site border border-muted-text/20 bg-background text-text shadow-sm ${href ? 'card-link' : ''} ${cardShape[variant]}`}
    >
      {media}
      <div
        className={`flex flex-1 flex-col items-start gap-2 ${variant === 'masonry' ? 'px-3 py-2' : 'p-site-sm'}`}
      >
        {variant === 'masonry' ? (
          // A photo wall: the heading reads as a caption under the photo.
          <p className="m-0 text-base text-muted-text">{card.heading}</p>
        ) : (
          <>
            {kicker}
            <Heading level={3}>{card.heading}</Heading>
          </>
        )}
        {card.text && (
          <p className="m-0 leading-relaxed text-muted-text">{card.text}</p>
        )}
        {button}
      </div>
    </Reveal>
  );
}
