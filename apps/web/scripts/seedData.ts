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
const photo = (seed: string, width = 1200, height = 750) => ({
  url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
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

const player = (name: string, role: string) => ({
  image: photo(
    `national-xv-${name.toLowerCase().replace(/ /g, '-')}`,
    800,
    1000,
  ),
  heading: `${name}, ${role}`,
});

export const pages: Omit<PageDocument, '_id'>[] = [
  {
    siteSlug: 'national-xv',
    path: '/',
    title: 'Home',
    description: 'News, squad and fixtures from the National XV.',
    updatedAt: now,
    tree: [
      node('imageSlider', {
        autoplay: true,
        slides: [
          {
            image: photo('national-xv-hero', 1600, 800),
            heading: 'Proud. Fast. Fearless.',
            text: 'The 2026 season starts here. Meet the squad taking on the world.',
            button: { label: 'About the team', href: '/about' },
          },
          {
            image: photo('national-xv-test-match', 1600, 800),
            heading: 'Test match this Saturday',
            text: 'National XV v Pacific Select, 7:45 pm at the Harbour Stadium.',
            button: { label: 'How to support us', href: '/about' },
          },
          {
            image: photo('national-xv-training-camp', 1600, 800),
            heading: 'Inside the training camp',
            text: 'A week with the squad before the first test.',
          },
        ],
      }),
      node(
        'section',
        {
          heading: 'Meet the squad',
          intro: 'Swipe through the players named for the first test.',
          layout: 'full',
          background: 'none',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'carousel',
            cards: [
              player('Sam Rivers', 'captain'),
              player('Jordan Hale', 'fly-half'),
              player('Alex Moana', 'lock'),
              player('Riley Shaw', 'hooker'),
              player('Kai Fenton', 'wing'),
              player('Noah Price', 'fullback'),
            ],
          }),
        ],
      ),
      node(
        'section',
        { heading: 'Latest', layout: 'two-column-wide', background: 'light' },
        [
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('national-xv-news-squad'),
                heading: 'Squad named for the opening test',
                link: { label: 'Read more', href: '/about' },
              },
              {
                image: photo('national-xv-news-debut'),
                heading: 'Three uncapped players get the call',
                link: { label: 'Read more', href: '/about' },
              },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('national-xv-tickets'),
                heading: 'Tickets on sale now',
              },
            ],
          }),
        ],
      ),
      node('cardGrid', {
        title: 'Gallery',
        variant: 'masonry',
        cards: [
          {
            image: photo('national-xv-gallery-1', 800, 1000),
            heading: 'Anthem',
          },
          {
            image: photo('national-xv-gallery-2', 800, 550),
            heading: 'Lineout',
          },
          {
            image: photo('national-xv-gallery-3', 800, 700),
            heading: 'First try',
          },
          {
            image: photo('national-xv-gallery-4', 800, 600),
            heading: 'The crowd',
          },
          {
            image: photo('national-xv-gallery-5', 800, 1050),
            heading: 'Full time',
          },
          {
            image: photo('national-xv-gallery-6', 800, 650),
            heading: 'Lap of honour',
          },
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
      node(
        'section',
        {
          heading: 'About the team',
          intro:
            'Over a century of test rugby, built on community clubs across the country.',
          layout: 'two-column',
          background: 'brand',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('national-xv-history'),
                heading: 'High performance programme',
              },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('national-xv-fans'),
                heading: 'Join the supporters club',
                link: { label: 'Back to home', href: '/' },
              },
            ],
          }),
        ],
      ),
      node(
        'section',
        {
          heading: 'What we stand for',
          layout: 'three-column',
          background: 'none',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              { image: photo('national-xv-respect'), heading: 'Respect' },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              { image: photo('national-xv-courage'), heading: 'Courage' },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              { image: photo('national-xv-teamwork'), heading: 'Teamwork' },
            ],
          }),
        ],
      ),
    ],
  },
  {
    siteSlug: 'coastal-union',
    path: '/',
    title: 'Home',
    description: 'Community and club rugby across the coast.',
    updatedAt: now,
    tree: [
      node('imageSlider', {
        autoplay: false,
        slides: [
          {
            image: photo('coastal-union-hero', 1600, 800),
            heading: 'Rugby for everyone on the coast',
            text: 'Registrations for juniors, seniors and women are open now.',
            button: { label: 'Fixtures and news', href: '/fixtures-and-news' },
          },
          {
            image: photo('coastal-union-grand-final', 1600, 800),
            heading: 'Harbour Hawks are champions',
            text: 'Relive the grand final at Seaside Oval.',
          },
        ],
      }),
      node(
        'section',
        {
          heading: 'Get started',
          intro:
            'Whether you want to play, coach or help out, there is a place for you.',
          layout: 'three-column',
          background: 'light',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('coastal-union-juniors'),
                heading: 'Play',
                link: { label: 'Find a club', href: '/fixtures-and-news' },
              },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('coastal-union-coaching'),
                heading: 'Coach and referee',
              },
            ],
          }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [
              {
                image: photo('coastal-union-volunteers'),
                heading: 'Volunteer',
              },
            ],
          }),
        ],
      ),
      node('cardGrid', {
        title: 'Latest news',
        variant: 'grid',
        cards: [
          {
            image: photo('coastal-union-final'),
            heading: 'Harbour Hawks win the grand final',
            link: { label: 'All news', href: '/fixtures-and-news' },
          },
          {
            image: photo('coastal-union-women'),
            heading: "Women's competition grows to 12 teams",
          },
          {
            image: photo('coastal-union-round-1'),
            heading: 'Round 1 fixtures announced',
          },
        ],
      }),
    ],
  },
  {
    siteSlug: 'coastal-union',
    path: '/fixtures-and-news',
    title: 'Fixtures and news',
    description: 'Upcoming matches and the latest from Coastal Union.',
    updatedAt: now,
    tree: [
      node(
        'section',
        { heading: 'Upcoming fixtures', layout: 'full', background: 'brand' },
        [
          node('cardGrid', {
            title: '',
            variant: 'carousel',
            cards: [
              {
                image: photo('coastal-union-fixture-1'),
                heading: 'Round 1 · Hawks v Rovers · Sat 2 pm',
              },
              {
                image: photo('coastal-union-fixture-2'),
                heading: 'Round 1 · Dolphins v Gulls · Sat 4 pm',
              },
              {
                image: photo('coastal-union-fixture-3'),
                heading: 'Round 2 · Rovers v Dolphins · Sat 2 pm',
              },
              {
                image: photo('coastal-union-fixture-4'),
                heading: 'Round 2 · Gulls v Hawks · Sat 4 pm',
              },
              {
                image: photo('coastal-union-fixture-5'),
                heading: 'Round 3 · Season launch',
                link: { label: 'Back to home', href: '/' },
              },
            ],
          }),
        ],
      ),
      node('section', { layout: 'two-column', background: 'none' }, [
        node('cardGrid', {
          title: 'Latest news',
          variant: 'grid',
          cards: [
            {
              image: photo('coastal-union-news-1'),
              heading: 'Volunteer of the year awards',
            },
            {
              image: photo('coastal-union-news-2'),
              heading: 'New lights for Seaside Oval',
            },
          ],
        }),
        node('cardGrid', {
          title: 'Club photos',
          variant: 'masonry',
          cards: [
            {
              image: photo('coastal-union-photo-1', 800, 1000),
              heading: 'Under 12s',
            },
            {
              image: photo('coastal-union-photo-2', 800, 600),
              heading: 'Training night',
            },
            {
              image: photo('coastal-union-photo-3', 800, 900),
              heading: 'Presentation day',
            },
            {
              image: photo('coastal-union-photo-4', 800, 650),
              heading: 'Beach session',
            },
          ],
        }),
      ]),
    ],
  },
];
