import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import type { SiteData } from '@/lib/news';
import { Carousel } from './Carousel';
import { ProfileCard } from './ProfileCard';

/** People as cards, in a carousel or a grid. Colours come from SiteData. */
export function ProfileGrid({
  title,
  display = 'carousel',
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
      className={
        display === 'carousel'
          ? 'w-4/5 shrink-0 snap-start @md:w-5/12 @3xl:w-1/4'
          : ''
      }
    />
  ));
  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {display === 'carousel' ? (
        <Carousel label={title || 'People'}>{cards}</Carousel>
      ) : (
        <div className="profiles-grid">{cards}</div>
      )}
    </div>
  );
}
