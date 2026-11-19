import { randomUUID } from 'node:crypto';
import type { ComponentType, PropsOf } from '../lib/components/registry';
import type { PageDocument, SiteDocument } from '../lib/db/documents';
import type { ComponentNode } from '../lib/types';

/** Typed helper: the compiler checks seed props against each component's schema. */
function node<Type extends ComponentType>(
  type: Type,
  props: PropsOf<Type>,
  children?: ComponentNode[],
): ComponentNode {
  return { id: randomUUID(), type, props, ...(children ? { children } : {}) };
}

/** Mock content only: placeholder photos and logos, fictional teams. */
const photo = (seed: string) => ({
  url: `https://picsum.photos/seed/${seed}/800/500`,
  alt: `Placeholder photo (${seed.replace(/-/g, ' ')})`,
});
const badge = (
  background: string,
  foreground: string,
  text: string,
  size = 96,
) =>
  `https://placehold.co/${size}x${size}/${background}/${foreground}/png?text=${text}`;

export const sites: Omit<SiteDocument, '_id'>[] = [
  {
    slug: 'national-xv',
    name: 'National XV',
    logoUrl: badge('e8b923', '0d2a1e', 'XV'),
    faviconUrl: badge('e8b923', '0d2a1e', 'XV', 64),
    // Deep green and gold on a dark background. Colours only: radius, font
    // and spacing come from the shared defaults.
    theme: {
      colors: {
        brand: '#e8b923',
        brandContrast: '#0d2a1e',
        background: '#0d2a1e',
        surfaceLight: '#16402d',
        text: '#f4f0e2',
        mutedText: '#b5c4b6',
      },
    },
  },
  {
    slug: 'coastal-union',
    name: 'Coastal Union',
    logoUrl: badge('0b2a5b', 'ffffff', 'CU'),
    faviconUrl: badge('0b2a5b', 'ffffff', 'CU', 64),
    // Navy and white on a light background.
    theme: {
      colors: {
        brand: '#0b2a5b',
        brandContrast: '#ffffff',
        background: '#ffffff',
        surfaceLight: '#eaf0f8',
        text: '#0b1f3a',
        mutedText: '#55657d',
      },
    },
  },
];

const now = new Date();

export const pages: Omit<PageDocument, '_id'>[] = [
  {
    siteSlug: 'national-xv',
    path: '/',
    title: 'Home',
    description: 'News, squad and fixtures from the National XV.',
    updatedAt: now,
    tree: [
      // Hero: a brand Section holding a one-card grid (heading, image, button).
      node('section', { layout: 'full', background: 'brand' }, [
        node('cardGrid', {
          title: 'Proud. Fast. Fearless.',
          cards: [
            {
              image: photo('national-xv-hero'),
              heading: 'The 2026 season starts here',
              link: { label: 'About the team', href: '/about' },
            },
          ],
        }),
      ]),
      node('section', { layout: 'two-column', background: 'none' }, [
        node('section', { layout: 'full', background: 'light' }, [
          node('cardGrid', {
            title: 'Our story',
            cards: [
              {
                image: photo('national-xv-history'),
                heading: 'Over a century of test rugby',
              },
            ],
          }),
        ]),
        node('section', { layout: 'full', background: 'light' }, [
          node('cardGrid', {
            title: 'Get involved',
            cards: [
              {
                image: photo('national-xv-clubs'),
                heading: 'Find a club near you',
                link: { label: 'Learn more', href: '/about' },
              },
            ],
          }),
        ]),
      ]),
      node('cardGrid', {
        title: 'Meet the squad',
        cards: [
          {
            image: photo('national-xv-captain'),
            heading: 'Sam Rivers, captain',
          },
          {
            image: photo('national-xv-flyhalf'),
            heading: 'Jordan Hale, fly-half',
          },
          { image: photo('national-xv-lock'), heading: 'Alex Moana, lock' },
        ],
      }),
    ],
  },
  {
    siteSlug: 'national-xv',
    path: '/about',
    title: 'About the National XV',
    description: 'Who we are and how to support the team.',
    updatedAt: now,
    tree: [
      node('section', { layout: 'full', background: 'light' }, [
        node('cardGrid', {
          title: 'About the team',
          cards: [
            {
              image: photo('national-xv-training'),
              heading: 'High performance programme',
            },
            {
              image: photo('national-xv-fans'),
              heading: 'Join the supporters club',
              link: { label: 'Back to home', href: '/' },
            },
          ],
        }),
      ]),
    ],
  },
  {
    siteSlug: 'coastal-union',
    path: '/',
    title: 'Home',
    description: 'Community and club rugby across the coast.',
    updatedAt: now,
    tree: [
      node('section', { layout: 'full', background: 'brand' }, [
        node('cardGrid', {
          title: 'Rugby for everyone on the coast',
          cards: [
            {
              image: photo('coastal-union-hero'),
              heading: 'Registrations are open',
              link: { label: 'Fixtures and news', href: '/fixtures-and-news' },
            },
          ],
        }),
      ]),
      node('section', { layout: 'two-column', background: 'light' }, [
        node('cardGrid', {
          title: 'Play',
          cards: [
            {
              image: photo('coastal-union-juniors'),
              heading: 'Junior and senior clubs',
            },
          ],
        }),
        node('cardGrid', {
          title: 'Coach and referee',
          cards: [
            {
              image: photo('coastal-union-coaching'),
              heading: 'Courses this season',
            },
          ],
        }),
      ]),
    ],
  },
  {
    siteSlug: 'coastal-union',
    path: '/fixtures-and-news',
    title: 'Fixtures and news',
    description: 'Upcoming matches and the latest from Coastal Union.',
    updatedAt: now,
    tree: [
      node('cardGrid', {
        title: 'Latest news',
        cards: [
          {
            image: photo('coastal-union-final'),
            heading: 'Harbour Hawks win the grand final',
            link: { label: 'Back to home', href: '/' },
          },
          {
            image: photo('coastal-union-women'),
            heading: "Women's competition grows to 12 teams",
          },
          {
            image: photo('coastal-union-round-1'),
            heading: 'Round 1 fixtures announced',
          },
          {
            image: photo('coastal-union-volunteers'),
            heading: 'Volunteer of the year awards',
          },
        ],
      }),
    ],
  },
];
