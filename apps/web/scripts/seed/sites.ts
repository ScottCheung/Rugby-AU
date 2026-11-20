import type { SiteDocument } from '../../lib/db/documents';
import type { Theme } from '../../lib/theme/types';

/**
 * Sample sites modelled on Australian rugby. Names and colours are used as
 * sample data; logos are plain text badges, not the real marks. Each site
 * overrides colours only (radius, font and spacing stay shared).
 */
export type SeedSite = Omit<SiteDocument, '_id'>;

const badge = (
  background: string,
  foreground: string,
  text: string,
  size: number,
) =>
  `https://placehold.co/${size}x${size}/${background.slice(1)}/${foreground.slice(1)}/png?text=${encodeURIComponent(text)}`;

function site(
  slug: string,
  name: string,
  category: SeedSite['category'],
  tagline: string,
  initials: string,
  colors: Theme['colors'],
): SeedSite {
  return {
    slug,
    name,
    category,
    tagline,
    logoUrl: badge(colors.brand, colors.brandContrast, initials, 96),
    faviconUrl: badge(colors.brand, colors.brandContrast, initials, 64),
    theme: { colors },
  };
}

// Reusable palettes: a light page with a brand colour, or a dark page.
const light = (
  brand: string,
  brandContrast: string,
  surfaceLight: string,
  text: string,
  mutedText: string,
) => ({
  brand,
  brandContrast,
  background: '#ffffff',
  surfaceLight,
  text,
  mutedText,
});

export const sites: SeedSite[] = [
  site(
    'rugby-australia',
    'Rugby Australia',
    'governing-body',
    'The home of rugby union in Australia',
    'RA',
    light('#1d1a5e', '#ffffff', '#e2f9f2', '#14123a', '#56547c'),
  ),

  site(
    'wallabies',
    'Wallabies',
    'national-team',
    "Australia's men's national rugby team",
    'W',
    {
      brand: '#f4c21b',
      brandContrast: '#0d2a1e',
      background: '#0d2a1e',
      surfaceLight: '#163e2c',
      text: '#f5f0e1',
      mutedText: '#b6c4b6',
    },
  ),
  site(
    'wallaroos',
    'Wallaroos',
    'national-team',
    "Australia's women's national rugby team",
    'WR',
    light('#0f5132', '#ffd34d', '#fff4cc', '#12261b', '#56624f'),
  ),
  site(
    'australia-sevens',
    'Australia Sevens',
    'national-team',
    "Australia's men's and women's sevens teams",
    '7s',
    light('#00843d', '#ffffff', '#ddf3e5', '#08301a', '#4d6656'),
  ),

  site(
    'brumbies',
    'ACT Brumbies',
    'super-rugby',
    'Super Rugby from Canberra',
    'B',
    light('#0a1f44', '#ffffff', '#fdf1cf', '#0a1f44', '#59617a'),
  ),
  site(
    'reds',
    'Queensland Reds',
    'super-rugby',
    'Super Rugby from Brisbane',
    'QR',
    light('#7b1e2b', '#ffffff', '#f6e3e6', '#2a0d12', '#6e5458'),
  ),
  site(
    'waratahs',
    'NSW Waratahs',
    'super-rugby',
    'Super Rugby from Sydney',
    'NSW',
    light('#4fb3e8', '#0b2240', '#e5f4fc', '#0b2240', '#526178'),
  ),
  site(
    'western-force',
    'Western Force',
    'super-rugby',
    'Super Rugby from Perth',
    'WF',
    {
      brand: '#f2b705',
      brandContrast: '#0f1115',
      background: '#0f1115',
      surfaceLight: '#1c2130',
      text: '#f2f3f5',
      mutedText: '#a9afba',
    },
  ),

  site(
    'nsw-rugby',
    'NSW Rugby',
    'state-union',
    'Community and club rugby in New South Wales',
    'NSW',
    light('#0b2240', '#8fd3f5', '#e5f4fc', '#0b2240', '#526178'),
  ),
  site(
    'queensland-rugby',
    'Queensland Rugby',
    'state-union',
    'Community and club rugby in Queensland',
    'QLD',
    light('#5c1522', '#ffd0d6', '#f6e3e6', '#2a0d12', '#6e5458'),
  ),
  site(
    'rugby-victoria',
    'Rugby Victoria',
    'state-union',
    'Community and club rugby in Victoria',
    'VIC',
    light('#002b5c', '#ffffff', '#e6edf7', '#0c1c33', '#56627a'),
  ),
  site(
    'rugby-wa',
    'Rugby WA',
    'state-union',
    'Community and club rugby in Western Australia',
    'WA',
    light('#111111', '#f2b705', '#fff4d0', '#111111', '#5c5c5c'),
  ),
  site(
    'rugby-south-australia',
    'Rugby South Australia',
    'state-union',
    'Community and club rugby in South Australia',
    'SA',
    light('#c8102e', '#ffffff', '#e8eef8', '#14213d', '#5a6275'),
  ),
  site(
    'tasmanian-rugby',
    'Tasmanian Rugby',
    'state-union',
    'Community and club rugby in Tasmania',
    'TAS',
    light('#00573f', '#ffd34d', '#e3f2ec', '#0d2a21', '#4f665d'),
  ),
  site(
    'nt-rugby',
    'NT Rugby',
    'state-union',
    'Community and club rugby in the Northern Territory',
    'NT',
    light('#b5541f', '#ffffff', '#f8e8dd', '#2b1408', '#6f5646'),
  ),
];
