import type { ComponentType, PropsInputOf } from './components/registry';
import type { ComponentInstance, PageDocument, Site } from './model';

/** Typed helper: the compiler checks seed props against each component schema. */
function node<Type extends ComponentType>(
  id: string,
  type: Type,
  props: PropsInputOf<Type>,
  children?: ComponentInstance[],
): ComponentInstance {
  return { id, type, props, ...(children ? { children } : {}) };
}

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const images = {
  stadium: {
    url: photo('1529663297269-6d349ec39b57'),
    alt: 'Rugby goal posts in a full stadium',
  },
  scrum: {
    url: photo('1480099225005-2513c8947aec', 900),
    alt: 'Two packs locked in a scrum',
  },
  carry: {
    url: photo('1558151507-c1aa3d917dbb', 900),
    alt: 'A player carrying a rugby ball',
  },
  ball: {
    url: photo('1676972523246-2ff4125551fb', 900),
    alt: 'Close-up of a rugby ball on the grass',
  },
  match: {
    url: photo('1512299286776-c18be8ed6a1a', 900),
    alt: 'Two teams contesting the ball during a match',
  },
  field: {
    url: photo('1698746019802-ec43b1b0db29', 900),
    alt: 'A rugby ball resting on a green field',
  },
};

export const sites: Site[] = [
  {
    id: 'wallabies',
    name: 'Wallabies',
    slug: 'wallabies',
    description: 'Australia’s national men’s rugby team',
    theme: {
      brand: '#f4c400',
      onBrand: '#14261d',
      accent: '#0b6b3a',
      surface: '#ffffff',
      background: '#f7f5ed',
      text: '#171717',
      muted: '#5a5a52',
      headingFont: "Georgia, 'Times New Roman', serif",
      radius: '2px',
    },
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ],
  },
  {
    id: 'super-rugby',
    name: 'Super Rugby Pacific',
    slug: 'super-rugby',
    description: 'The home of Super Rugby Pacific',
    theme: {
      brand: '#502080',
      onBrand: '#ffffff',
      accent: '#df2a3f',
      surface: '#ffffff',
      background: '#f5f1f8',
      text: '#1e1725',
      muted: '#675f6e',
      headingFont:
        "'Arial Black', 'Helvetica Neue', Inter, system-ui, sans-serif",
      radius: '16px',
    },
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'About the competition', href: '/about' },
    ],
  },
];

const page = (
  id: string,
  siteId: string,
  path: string,
  title: string,
  components: ComponentInstance[],
): PageDocument => ({
  id,
  siteId,
  path,
  title,
  schemaVersion: 1,
  status: 'published',
  updatedAt: '2026-11-19T00:00:00.000Z',
  components,
});

export const pages: PageDocument[] = [
  page('wallabies-home', 'wallabies', '/', 'Wallabies', [
    node('wallabies-hero', 'section', { background: 'brand' }, [
      node('wallabies-hero-grid', 'card-grid', {
        title: 'Built for the big moments',
        cards: [
          {
            image: images.stadium,
            heading: 'The Wallabies are ready',
            link: { label: 'About the team', href: '/about' },
          },
        ],
      }),
    ]),
    node('wallabies-explore', 'section', { background: 'light' }, [
      node('wallabies-explore-grid', 'card-grid', {
        title: 'Explore the team',
        cards: [
          {
            image: images.scrum,
            heading: 'Our squad',
            link: { label: 'Meet the players', href: '/about' },
          },
          { image: images.match, heading: 'Fixtures & results' },
        ],
      }),
    ]),
  ]),
  page('wallabies-about', 'wallabies', '/about', 'About the Wallabies', [
    node('wallabies-about-columns', 'section', { layout: 'two-column' }, [
      node('wallabies-about-history', 'section', { background: 'light' }, [
        node('wallabies-about-history-grid', 'card-grid', {
          title: 'Our history',
          cards: [{ image: images.ball, heading: 'Since 1899' }],
        }),
      ]),
      node('wallabies-about-join', 'section', { background: 'brand' }, [
        node('wallabies-about-join-grid', 'card-grid', {
          title: 'Get involved',
          cards: [
            {
              image: images.carry,
              heading: 'Find a club near you',
              link: { label: 'Back to home', href: '/' },
            },
          ],
        }),
      ]),
    ]),
  ]),
  page('super-home', 'super-rugby', '/', 'Super Rugby Pacific', [
    node('super-hero', 'section', { background: 'brand' }, [
      node('super-hero-grid', 'card-grid', {
        title: 'Rugby without borders',
        cards: [
          {
            image: images.match,
            heading: 'One competition. One Pacific.',
            link: { label: 'About the competition', href: '/about' },
          },
        ],
      }),
    ]),
    node('super-explore', 'section', { background: 'light' }, [
      node('super-explore-grid', 'card-grid', {
        title: 'Explore the competition',
        cards: [
          { image: images.carry, heading: 'Meet the clubs' },
          { image: images.stadium, heading: 'Match centre' },
          { image: images.field, heading: 'Fan zone' },
        ],
      }),
    ]),
  ]),
  page('super-about', 'super-rugby', '/about', 'About the competition', [
    node(
      'super-about-columns',
      'section',
      { layout: 'two-column', background: 'light' },
      [
        node('super-about-format', 'card-grid', {
          title: 'The format',
          cards: [{ image: images.scrum, heading: '12 teams, 5 nations' }],
        }),
        node('super-about-finals', 'section', { background: 'brand' }, [
          node('super-about-finals-grid', 'card-grid', {
            title: 'Finals series',
            cards: [
              {
                image: images.stadium,
                heading: 'Six teams make the playoffs',
                link: { label: 'Back to home', href: '/' },
              },
            ],
          }),
        ]),
      ],
    ),
  ]),
];
