import { photoSources, type PlayerPhoto } from './playerPhotos';

/**
 * Where to look for a player's official photo, per site: the team's own
 * squad page first, then pages the same players appear on (a Wallaby's club,
 * a Sevens player's fifteens team).
 */
const lookIn: Record<string, string[]> = {
  wallabies: ['wallabies', 'reds', 'brumbies', 'waratahs', 'western-force'],
  wallaroos: ['wallaroos', 'sevens-women'],
  'australia-sevens': ['sevens-men', 'sevens-women', 'wallaroos'],
  reds: ['reds', 'wallabies'],
  brumbies: ['brumbies', 'wallabies'],
  waratahs: ['waratahs', 'wallabies'],
  'western-force': ['western-force', 'wallabies'],
};

/** Names compared without case, accents, punctuation or spacing. */
export const nameKey = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

/** The official photo of a player on a site's squad, if one was found. */
export function playerPhoto(
  siteSlug: string,
  name: string,
): (PlayerPhoto & { source: string }) | undefined {
  for (const source of lookIn[siteSlug] ?? []) {
    const found = photoSources[source]?.players[nameKey(name)];
    if (found) return { ...found, source: photoSources[source].url };
  }
  return undefined;
}
