import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import type { SiteData } from '@/lib/news';
import { Carousel } from './Carousel';
import { ProfileCard } from './ProfileCard';

/** How wide one carousel item (a card, or a column of two) is. */
const carouselItem = 'w-4/5 shrink-0 snap-start @md:w-5/12 @3xl:w-1/4';

/** People as cards, in a carousel or a grid. Colours come from SiteData. */
export function ProfileGrid({
  title,
  display = 'carousel',
  rows = 'one',
  profiles,
  siteSlug,
  data,
}: PropsOf<'profileGrid'> & { siteSlug: string; data: SiteData }) {
  const cards = profiles.map((profile, index) => (
    <ProfileCard
      key={index}
      index={index}
      profile={profile}
      color={profile.background && data.colors[profile.background.url]}
      siteSlug={siteSlug}
      className={display === 'carousel' && rows === 'one' ? carouselItem : ''}
    />
  ));
  // Two rows: the carousel scrolls columns of two cards.
  const columns =
    rows === 'two'
      ? Array.from({ length: Math.ceil(cards.length / 2) }, (_, column) => (
          <div key={column} className={`profiles-column ${carouselItem}`}>
            {cards.slice(column * 2, column * 2 + 2)}
          </div>
        ))
      : cards;
  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {display === 'carousel' ? (
        <Carousel label={title || 'People'}>{columns}</Carousel>
      ) : (
        <div className="profiles-grid">{cards}</div>
      )}
    </div>
  );
}
