import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';

export function CardGrid({
  title,
  cards,
  siteSlug,
}: PropsOf<'cardGrid'> & { siteSlug: string }) {
  return (
    <div className="flex flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {/* auto-fit: one card fills the row, several share it. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-site-sm">
        {cards.map((card, index) => {
          const href = card.link && resolveHref(card.link.href, siteSlug);
          return (
            <article
              key={index}
              className="flex flex-col overflow-hidden rounded-site border border-muted-text/20 bg-background text-text shadow-sm"
            >
              <div className="aspect-[16/9] max-h-80 bg-surface-light">
                <Image src={card.image.url} alt={card.image.alt} />
              </div>
              <div className="flex flex-1 flex-col items-start gap-3 p-site-sm">
                <Heading level={3}>{card.heading}</Heading>
                {card.link && href && (
                  <Button href={href}>{card.link.label}</Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
