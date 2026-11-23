import { ProfileCard } from '../ProfileCard';
import type { ItemProps } from './types';

/** A person card, in the colour picked from its photo (`tint`). */
export function PersonItem({ item, style, siteSlug }: ItemProps<'people'>) {
  return (
    <ProfileCard
      siteSlug={siteSlug}
      color={item.tint}
      backgroundHeight={Number(style.backgroundHeight ?? '70')}
      profile={{
        name: item.title ?? '',
        role: item.subtitle,
        text: item.text,
        cutout: item.cutout,
        background: item.background,
        link: item.link,
      }}
    />
  );
}
