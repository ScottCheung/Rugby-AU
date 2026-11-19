import { ButtonLink } from '@/components/blocks/button-link';
import { Heading } from '@/components/blocks/heading';
import { Image } from '@/components/blocks/image';
import { resolveSiteHref } from '@/lib/links';
import type { ComponentRenderer } from './types';

export const CardGrid: ComponentRenderer<'card-grid'> = ({
  props,
  context,
}) => (
  <div className="card-grid-block">
    {props.title && (
      <div className="block-heading">
        <Heading level={2}>{props.title}</Heading>
        <span className="heading-rule" />
      </div>
    )}
    <div className="site-card-grid">
      {props.cards.map((card, index) => {
        const href =
          card.link && resolveSiteHref(card.link.href, context.siteSlug);
        return (
          <article className="site-card" key={index}>
            <div className="site-card-image">
              <Image src={card.image.url} alt={card.image.alt} />
            </div>
            <div className="site-card-content">
              <Heading level={3}>{card.heading}</Heading>
              {card.link && href && (
                <ButtonLink href={href} variant="secondary" size="sm">
                  {card.link.label}
                </ButtonLink>
              )}
            </div>
          </article>
        );
      })}
    </div>
  </div>
);
