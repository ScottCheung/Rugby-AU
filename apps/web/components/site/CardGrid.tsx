import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';
import { Carousel } from './Carousel';
import { Lightbox } from './Lightbox';

type Props = PropsOf<'cardGrid'> & { siteSlug: string };
type CardData = Props['cards'][number];

/** One set of cards, three presentations chosen by the `variant` prop. */
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

  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {variant === 'carousel' ? (
        <Carousel label={title || 'Cards'}>{items}</Carousel>
      ) : variant === 'masonry' ? (
        // CSS columns: cards keep their photo's height and flow top to bottom.
        // Photos without a link open full size.
        <Lightbox
          photos={cards.map((card) => ({
            url: card.image.url,
            alt: card.image.alt,
            caption: card.heading,
          }))}
        >
          <div className="columns-1 gap-site-sm @md:columns-2 @3xl:columns-3">
            {items}
          </div>
        </Lightbox>
      ) : (
        // auto-fit: one card fills the row, several share it.
        <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-site-sm">
          {items}
        </div>
      )}
    </div>
  );
}

const cardShape: Record<Props['variant'], string> = {
  grid: '',
  carousel: 'w-4/5 shrink-0 snap-start @md:w-5/12 @3xl:w-1/3',
  masonry: 'mb-site-sm break-inside-avoid',
};

function Card({
  card,
  index,
  siteSlug,
  variant,
}: {
  card: CardData;
  index: number;
  siteSlug: string;
  variant: Props['variant'];
}) {
  const href = card.link && resolveHref(card.link.href, siteSlug);
  return (
    <article
      // relative: a card's link stretches over the whole card.
      className={`relative flex flex-col overflow-hidden rounded-site border border-muted-text/20 bg-background text-text shadow-sm ${href ? 'card-link' : ''} ${cardShape[variant]}`}
    >
      {variant === 'masonry' && !href ? (
        <button
          type="button"
          data-lightbox-index={index}
          aria-label={`View photo: ${card.heading}`}
          className="zoomable block w-full cursor-zoom-in overflow-hidden"
        >
          <Image src={card.image.url} alt={card.image.alt} fit="natural" />
        </button>
      ) : variant === 'masonry' ? (
        <Image src={card.image.url} alt={card.image.alt} fit="natural" />
      ) : (
        <div className="media-card overflow-hidden bg-surface-light">
          <Image src={card.image.url} alt={card.image.alt} />
        </div>
      )}
      <div
        className={`flex flex-1 flex-col items-start gap-2 ${variant === 'masonry' ? 'px-3 py-2' : 'p-site-sm'}`}
      >
        {variant === 'masonry' ? (
          // A photo wall: the heading reads as a caption under the photo.
          <p className="m-0 text-sm text-muted-text">{card.heading}</p>
        ) : (
          <Heading level={3}>{card.heading}</Heading>
        )}
        {card.text && (
          <p className="m-0 leading-relaxed text-muted-text">{card.text}</p>
        )}
        {card.link && href && (
          // mt-auto keeps buttons on one line across a row of cards.
          <div className="mt-auto pt-2">
            <Button href={href} stretched>
              {card.link.label}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
