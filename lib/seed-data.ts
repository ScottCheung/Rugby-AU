import type { PageDocument, Site } from './model';

export const sites: Site[] = [
  {
    id: 'wallabies',
    name: 'Wallabies',
    slug: 'wallabies',
    description: 'Australia’s national men’s rugby team',
    theme: {
      brand: '#f4c400',
      accent: '#111827',
      surface: '#ffffff',
      background: '#f7f5ed',
      text: '#171717',
      muted: '#5a5a52',
    },
  },
  {
    id: 'super-rugby',
    name: 'Super Rugby Pacific',
    slug: 'super-rugby',
    description: 'The home of Super Rugby Pacific',
    theme: {
      brand: '#502080',
      accent: '#df2a3f',
      surface: '#ffffff',
      background: '#f5f1f8',
      text: '#1e1725',
      muted: '#675f6e',
    },
  },
];

const section = (
  id: string,
  background: string,
  cards: {
    image: { url: string; alt: string };
    heading: string;
    link?: { label: string; href: string };
  }[],
) => ({
  id: `${id}-section`,
  type: 'section' as const,
  props: { layout: 'full', background },
  children: [
    {
      id: `${id}-grid`,
      type: 'card-grid' as const,
      props: { title: 'Explore the team', cards },
    },
  ],
});

export const pages: PageDocument[] = [
  {
    id: 'wallabies-home',
    siteId: 'wallabies',
    path: '/',
    title: 'Wallabies',
    status: 'published',
    updatedAt: '2026-11-19T00:00:00.000Z',
    components: [
      {
        id: 'wallabies-hero',
        type: 'section',
        props: { layout: 'full', background: 'brand' },
        children: [
          {
            id: 'wallabies-hero-grid',
            type: 'card-grid',
            props: {
              title: 'Built for the big moments',
              cards: [
                {
                  image: {
                    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
                    alt: 'Rugby stadium filled with fans',
                  },
                  heading: 'The Wallabies are ready',
                  link: { label: 'Meet the team', href: '#team' },
                },
              ],
            },
          },
        ],
      },
      section('wallabies', 'light', [
        {
          image: {
            url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85',
            alt: 'Rugby players in a match',
          },
          heading: 'Our squad',
          link: { label: 'View players', href: '#team' },
        },
        {
          image: {
            url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=85',
            alt: 'Rugby ball on the field',
          },
          heading: 'Fixtures & results',
          link: { label: 'See fixtures', href: '#team' },
        },
      ]),
    ],
  },
  {
    id: 'super-home',
    siteId: 'super-rugby',
    path: '/',
    title: 'Super Rugby Pacific',
    status: 'published',
    updatedAt: '2026-11-19T00:00:00.000Z',
    components: [
      {
        id: 'super-hero',
        type: 'section',
        props: { layout: 'full', background: 'brand' },
        children: [
          {
            id: 'super-hero-grid',
            type: 'card-grid',
            props: {
              title: 'Rugby without borders',
              cards: [
                {
                  image: {
                    url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=85',
                    alt: 'Rugby ball on a field',
                  },
                  heading: 'One competition. One Pacific.',
                  link: { label: 'Explore the competition', href: '#team' },
                },
              ],
            },
          },
        ],
      },
      section('super', 'light', [
        {
          image: {
            url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85',
            alt: 'Rugby match under way',
          },
          heading: 'Meet the clubs',
          link: { label: 'View clubs', href: '#team' },
        },
        {
          image: {
            url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=900&q=85',
            alt: 'Stadium under lights',
          },
          heading: 'Match centre',
          link: { label: 'View matches', href: '#team' },
        },
      ]),
    ],
  },
];
