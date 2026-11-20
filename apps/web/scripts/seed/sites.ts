import type { SiteDocument } from '../../lib/db/documents';
import type { Theme } from '../../lib/theme/types';

/**
 * Sample sites modelled on Australian rugby. Each site overrides colours only
 * (radius, font and spacing stay shared).
 *
 * Logos are the organisations' own logos, hotlinked from the files used on
 * their English Wikipedia articles (upload.wikimedia.org). They are not copied
 * into this repository and remain the property of their owners.
 */
export type SeedSite = Omit<SiteDocument, '_id'>;

const wiki = 'https://upload.wikimedia.org/wikipedia';

/** Official logos, by site slug. */
const logos: Record<string, string> = {
  'rugby-australia': `${wiki}/commons/8/8b/Rugby_Australia_2017_vector_logo.svg`,
  wallabies: `${wiki}/en/0/02/WallabiesRugbyUnionLogo.svg`,
  wallaroos: `${wiki}/en/9/94/Australia_women%27s_national_rugby_union_team_%28Wallaroos%29_Logo.png`,
  'australia-sevens': `${wiki}/en/b/ba/Australia_national_rugby_sevens_team_logo.svg`,
  brumbies: `${wiki}/en/5/53/Brumbies_Rugby_logo.svg`,
  reds: `${wiki}/en/e/e1/QLD_reds_logo.svg`,
  waratahs: `${wiki}/en/6/6f/Waratahs_logo.svg`,
  'western-force': `${wiki}/en/0/01/Western_force_rugby_logo.png`,
  'nsw-rugby': `${wiki}/en/6/66/Logo_of_the_NSW_Rugby_Union_2018.webp`,
  'queensland-rugby': `${wiki}/en/6/6c/Queensland_rugby.jpg`,
  'rugby-victoria': `${wiki}/en/a/a7/Rugby_Victoria_logo.png`,
  'rugby-wa': `${wiki}/en/2/2a/RugbyWA_logo.png`,
  'rugby-south-australia': `${wiki}/en/4/4a/Rugby_Union_South_Australia_logo.png`,
  'tasmanian-rugby': `${wiki}/en/6/67/Tasmanian_Rugby_Union_logo.svg`,
  'nt-rugby': `${wiki}/en/4/43/Northern_Territory_Rugby_Union_logo%2C_June_2013.png`,
};

function site(
  slug: string,
  name: string,
  category: SeedSite['category'],
  tagline: string,
  colors: Theme['colors'],
): SeedSite {
  return {
    slug,
    name,
    category,
    tagline,
    logoUrl: logos[slug],
    faviconUrl: logos[slug],
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
    light('#1d1a5e', '#ffffff', '#e2f9f2', '#14123a', '#56547c'),
  ),

  site(
    'wallabies',
    'Wallabies',
    'national-team',
    "Australia's men's national rugby team",
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
    light('#0f5132', '#ffd34d', '#fff4cc', '#12261b', '#56624f'),
  ),
  site(
    'australia-sevens',
    'Australia Sevens',
    'national-team',
    "Australia's men's and women's sevens teams",
    light('#00843d', '#ffffff', '#ddf3e5', '#08301a', '#4d6656'),
  ),

  site(
    'brumbies',
    'ACT Brumbies',
    'super-rugby',
    'Super Rugby from Canberra',
    light('#0a1f44', '#ffffff', '#fdf1cf', '#0a1f44', '#59617a'),
  ),
  site(
    'reds',
    'Queensland Reds',
    'super-rugby',
    'Super Rugby from Brisbane',
    light('#7b1e2b', '#ffffff', '#f6e3e6', '#2a0d12', '#6e5458'),
  ),
  site(
    'waratahs',
    'NSW Waratahs',
    'super-rugby',
    'Super Rugby from Sydney',
    light('#4fb3e8', '#0b2240', '#e5f4fc', '#0b2240', '#526178'),
  ),
  site(
    'western-force',
    'Western Force',
    'super-rugby',
    'Super Rugby from Perth',
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
    light('#0b2240', '#8fd3f5', '#e5f4fc', '#0b2240', '#526178'),
  ),
  site(
    'queensland-rugby',
    'Queensland Rugby',
    'state-union',
    'Community and club rugby in Queensland',
    light('#5c1522', '#ffd0d6', '#f6e3e6', '#2a0d12', '#6e5458'),
  ),
  site(
    'rugby-victoria',
    'Rugby Victoria',
    'state-union',
    'Community and club rugby in Victoria',
    light('#002b5c', '#ffffff', '#e6edf7', '#0c1c33', '#56627a'),
  ),
  site(
    'rugby-wa',
    'Rugby WA',
    'state-union',
    'Community and club rugby in Western Australia',
    light('#111111', '#f2b705', '#fff4d0', '#111111', '#5c5c5c'),
  ),
  site(
    'rugby-south-australia',
    'Rugby South Australia',
    'state-union',
    'Community and club rugby in South Australia',
    light('#c8102e', '#ffffff', '#e8eef8', '#14213d', '#5a6275'),
  ),
  site(
    'tasmanian-rugby',
    'Tasmanian Rugby',
    'state-union',
    'Community and club rugby in Tasmania',
    light('#00573f', '#ffd34d', '#e3f2ec', '#0d2a21', '#4f665d'),
  ),
  site(
    'nt-rugby',
    'NT Rugby',
    'state-union',
    'Community and club rugby in the Northern Territory',
    light('#b5541f', '#ffffff', '#f8e8dd', '#2b1408', '#6f5646'),
  ),
];
