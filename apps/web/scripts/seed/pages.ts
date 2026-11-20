import { randomUUID } from 'node:crypto';
import type { ComponentType, PropsOf } from '../../lib/components/registry';
import type { PageDocument } from '../../lib/db/documents';
import type { ComponentNode } from '../../lib/types';
import { images, type SeedImage } from './images';

/**
 * Page content for the sample sites. Each kind of site (governing body,
 * national team, Super Rugby club, state union) has one template filled in
 * with that site's facts, so adding a site is mostly adding data. The copy
 * is written for this demo from public facts; it is not taken from any site.
 */

type Card = PropsOf<'cardGrid'>['cards'][number];
type Slide = PropsOf<'imageSlider'>['slides'][number];
type Link = { label: string; href: string };
export type SeedPage = Omit<PageDocument, '_id'>;

/** Typed helper: the compiler checks seed props against each component's schema. */
function node<Type extends ComponentType>(
  type: Type,
  props: PropsOf<Type>,
  children?: ComponentNode[],
): ComponentNode {
  return { id: randomUUID(), type, props, ...(children ? { children } : {}) };
}

const card = (image: SeedImage, heading: string, link?: Link): Card => ({
  image,
  heading,
  ...(link ? { link } : {}),
});
const slide = (
  image: SeedImage,
  heading: string,
  text: string,
  button?: Link,
): Slide => ({
  image,
  heading,
  text,
  ...(button ? { button } : {}),
});
const link = (label: string, href: string): Link => ({ label, href });

const now = new Date();
const page = (
  siteSlug: string,
  path: string,
  title: string,
  description: string,
  tree: ComponentNode[],
): SeedPage => ({
  siteSlug,
  path,
  title,
  description,
  tree,
  updatedAt: now,
});

/** One card per column, e.g. "Play / Coach / Volunteer". */
const columns = (
  heading: string,
  intro: string,
  background: 'none' | 'light' | 'brand',
  cards: Card[],
) =>
  node(
    'section',
    {
      heading,
      intro,
      layout: cards.length === 2 ? 'two-column' : 'three-column',
      background,
    },
    cards.map((item) =>
      node('cardGrid', { title: '', variant: 'grid', cards: [item] }),
    ),
  );

// ---------------------------------------------------------- governing body

function governingBody(): SeedPage[] {
  const slug = 'rugby-australia';
  return [
    page(
      slug,
      '/',
      'Home',
      'Teams, competitions and community rugby across Australia.',
      [
        node('imageSlider', {
          autoplay: true,
          slides: [
            slide(
              images.stadiumNight,
              'Rugby World Cup 2027 is coming home',
              'Australia hosts the men’s tournament from 1 October to 13 November 2027, with the final in Sydney.',
              link('About the tournament', '/about'),
            ),
            slide(
              images.womenPlaying,
              'Women’s Rugby World Cup 2029',
              'Two years later, Australia welcomes the world’s best women’s teams.',
              link('Our major events', '/about'),
            ),
            slide(
              images.celebration,
              'Rugby for everyone',
              'From under 6s to veterans, there is a club near you.',
            ),
          ],
        }),
        node(
          'section',
          {
            heading: 'Our teams',
            intro: 'Four levels of rugby, one game.',
            layout: 'full',
            background: 'none',
          },
          [
            node('cardGrid', {
              title: '',
              variant: 'carousel',
              cards: [
                card(images.stadium, 'Wallabies'),
                card(images.womenJerseys, 'Wallaroos'),
                card(images.pass, 'Australia Sevens'),
                card(images.scrum, 'Super Rugby clubs'),
                card(images.ballField, 'Community rugby'),
              ],
            }),
          ],
        ),
        columns(
          'Get involved',
          'Play, coach, referee or help out at your local club.',
          'light',
          [
            card(images.match, 'Play', link('Find out more', '/about')),
            card(images.carry, 'Coach'),
            card(images.breakaway, 'Referee and volunteer'),
          ],
        ),
        node('cardGrid', {
          title: 'Around the country',
          variant: 'masonry',
          cards: [
            card(images.sydneyAerial, 'Sydney'),
            card(images.brisbaneBridge, 'Brisbane'),
            card(images.canberraBalloons, 'Canberra'),
            card(images.perthCity, 'Perth'),
            card(images.melbourneSkyline, 'Melbourne'),
            card(images.adelaideStadium, 'Adelaide'),
            card(images.hobartHarbour, 'Hobart'),
            card(images.uluru, 'Northern Territory'),
          ],
        }),
      ],
    ),
    page(
      slug,
      '/about',
      'About Rugby Australia',
      'Who we are and the major events coming to Australia.',
      [
        node(
          'section',
          {
            heading: 'About Rugby Australia',
            intro:
              'The national governing body for rugby union, looking after the national teams, professional rugby and the community game in every state and territory.',
            layout: 'two-column',
            background: 'brand',
          },
          [
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [
                card(images.scrum, 'High performance'),
                card(images.ballField, 'Community rugby'),
              ],
            }),
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [
                card(images.celebration, 'Women’s rugby'),
                card(images.pass, 'Sevens'),
              ],
            }),
          ],
        ),
        columns(
          'Major events',
          'A decade of world-class rugby in Australia.',
          'none',
          [
            card(images.stadiumNight, 'Men’s Rugby World Cup 2027'),
            card(
              images.womenPlaying,
              'Women’s Rugby World Cup 2029',
              link('Back to home', '/'),
            ),
          ],
        ),
      ],
    ),
  ];
}

// ---------------------------------------------------------- national teams

type NationalTeam = {
  slug: string;
  slides: Slide[];
  moments: Card[];
  news: Card[];
  nextUp: Card;
  gallery: SeedImage[];
  history: { intro: string; cards: Card[] };
};

function nationalTeam(team: NationalTeam): SeedPage[] {
  return [
    page(team.slug, '/', 'Home', 'News, history and the road ahead.', [
      node('imageSlider', { autoplay: true, slides: team.slides }),
      node(
        'section',
        {
          heading: 'Moments',
          intro: 'Swipe through some of the milestones.',
          layout: 'full',
          background: 'none',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'carousel',
            cards: team.moments,
          }),
        ],
      ),
      node(
        'section',
        { heading: 'Latest', layout: 'two-column-wide', background: 'light' },
        [
          node('cardGrid', { title: '', variant: 'grid', cards: team.news }),
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: [team.nextUp],
          }),
        ],
      ),
      node('cardGrid', {
        title: 'Gallery',
        variant: 'masonry',
        cards: team.gallery.map((image) => card(image, image.alt)),
      }),
    ]),
    page(team.slug, '/history', 'History', 'Where the team comes from.', [
      node(
        'section',
        {
          heading: 'Our history',
          intro: team.history.intro,
          layout: 'full',
          background: 'brand',
        },
        [
          node('cardGrid', {
            title: '',
            variant: 'grid',
            cards: team.history.cards,
          }),
        ],
      ),
    ]),
  ];
}

const historyLink = link('Our history', '/history');

const wallabies = nationalTeam({
  slug: 'wallabies',
  slides: [
    slide(
      images.stadium,
      'Gold jersey, green and gold hearts',
      'The men’s national team has worn the gold jersey for generations.',
      historyLink,
    ),
    slide(
      images.stadiumNight,
      'Road to Rugby World Cup 2027',
      'A home World Cup, with the final at Stadium Australia in Sydney.',
    ),
    slide(
      images.scrum,
      'The Bledisloe Cup',
      'The trans-Tasman rivalry with New Zealand.',
      historyLink,
    ),
  ],
  moments: [
    card(
      images.ballLeaves,
      '1899: the first Test, against the British Isles in Sydney',
    ),
    card(images.celebration, '1991: Rugby World Cup champions'),
    card(images.stadiumStands, '1999: world champions again'),
    card(images.scrum, 'The Bledisloe Cup against New Zealand'),
    card(images.stadiumNight, 'The Rugby Championship'),
  ],
  news: [
    card(images.tackle, 'Squad named for the next Test window', historyLink),
    card(images.carry, 'Young players called into camp', historyLink),
  ],
  nextUp: card(images.stadiumSunny, 'Next up: a home Test'),
  gallery: [
    images.stadium,
    images.scrum,
    images.tackle,
    images.celebration,
    images.ball,
    images.stadiumStands,
  ],
  history: {
    intro: 'From the first Test in 1899 to two Rugby World Cup titles.',
    cards: [
      card(images.ballLeaves, '1899: first Test'),
      card(images.celebration, '1991 and 1999: world champions'),
      card(
        images.stadiumNight,
        '2027: a home World Cup',
        link('Back to home', '/'),
      ),
    ],
  },
});

const wallaroos = nationalTeam({
  slug: 'wallaroos',
  slides: [
    slide(
      images.womenPlaying,
      'The Wallaroos',
      'Australia’s women’s fifteens team, playing Test rugby since 1994.',
      historyLink,
    ),
    slide(
      images.stadiumStands,
      'Women’s Rugby World Cup 2029',
      'A home World Cup is on the way.',
    ),
  ],
  moments: [
    card(
      images.womenJerseys,
      '1994: first Test, against New Zealand at North Sydney Oval',
    ),
    card(images.womenPlaying, '1998: first Rugby World Cup appearance'),
    card(images.celebration, 'Growing the women’s game in every state'),
    card(images.stadiumStands, '2029: a home World Cup'),
  ],
  news: [
    card(images.pass, 'Squad named for the international season', historyLink),
    card(
      images.breakaway,
      'Pathway players join the national camp',
      historyLink,
    ),
  ],
  nextUp: card(images.stadiumSunny, 'Next up: a home Test'),
  gallery: [
    images.womenPlaying,
    images.womenJerseys,
    images.celebration,
    images.ballField,
    images.stadiumSeats,
  ],
  history: {
    intro:
      'The Wallaroos played their first Test on 2 September 1994 against the Black Ferns in Sydney.',
    cards: [
      card(images.womenJerseys, '1994: first Test'),
      card(images.womenPlaying, '1998: first World Cup'),
      card(
        images.stadiumStands,
        '2029: home World Cup',
        link('Back to home', '/'),
      ),
    ],
  },
});

const sevens = nationalTeam({
  slug: 'australia-sevens',
  slides: [
    slide(
      images.pass,
      'Fast, open, seven a side',
      'Australia’s men’s and women’s sevens teams.',
      historyLink,
    ),
    slide(
      images.celebration,
      'Olympic champions',
      'Australia’s women won the first Olympic rugby sevens gold, at Rio 2016.',
      historyLink,
    ),
  ],
  moments: [
    card(images.celebration, 'Rio 2016: women’s Olympic gold'),
    card(images.breakaway, 'World series tournaments around the globe'),
    card(images.pass, 'Pathways for young sevens players'),
  ],
  news: [
    card(images.breakaway, 'Squads named for the next tournament', historyLink),
    card(images.carry, 'Training camp on the Gold Coast', historyLink),
  ],
  nextUp: card(images.stadiumSeats, 'Next up: a world series weekend'),
  gallery: [
    images.pass,
    images.breakaway,
    images.celebration,
    images.ballMorning,
    images.stadiumSunny,
  ],
  history: {
    intro:
      'Sevens became an Olympic sport at Rio 2016, where Australia’s women won the first gold medal.',
    cards: [
      card(images.celebration, 'Rio 2016: Olympic gold'),
      card(images.pass, 'A world series every year', link('Back to home', '/')),
    ],
  },
});

// --------------------------------------------------------- Super Rugby clubs

type Club = {
  slug: string;
  name: string;
  city: string;
  ground: string;
  cityImages: [SeedImage, SeedImage];
  intro: string;
  honours: Card[];
};

function club(team: Club): SeedPage[] {
  const clubLink = link('About the club', '/club');
  return [
    page(
      team.slug,
      '/',
      'Home',
      `${team.name}: Super Rugby from ${team.city}.`,
      [
        node('imageSlider', {
          autoplay: true,
          slides: [
            slide(
              team.cityImages[0],
              `${team.name}`,
              `Super Rugby from ${team.city}.`,
              clubLink,
            ),
            slide(
              images.stadiumNight,
              `Home games at ${team.ground}`,
              'Bring the family and wear the colours.',
            ),
          ],
        }),
        columns('This season', 'Everything you need for match day.', 'light', [
          card(images.stadiumStands, 'Memberships', clubLink),
          card(images.stadiumSeats, 'Tickets'),
          card(images.ballMorning, 'Junior clinics'),
        ]),
        node(
          'section',
          {
            heading: 'Home ground',
            layout: 'two-column-wide',
            background: 'none',
          },
          [
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [card(images.stadiumSunny, team.ground)],
            }),
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [card(team.cityImages[1], team.city)],
            }),
          ],
        ),
        node('cardGrid', {
          title: 'Gallery',
          variant: 'masonry',
          cards: [
            images.tackle,
            team.cityImages[0],
            images.scrum,
            images.celebration,
            images.ball,
          ].map((image) => card(image, image.alt)),
        }),
      ],
    ),
    page(
      team.slug,
      '/club',
      'About the club',
      `The story of the ${team.name}.`,
      [
        node(
          'section',
          {
            heading: `About the ${team.name}`,
            intro: team.intro,
            layout: 'full',
            background: 'brand',
          },
          [
            node('cardGrid', {
              title: 'Honours and milestones',
              variant: 'carousel',
              cards: team.honours,
            }),
          ],
        ),
      ],
    ),
  ];
}

const backHome = link('Back to home', '/');

const brumbies = club({
  slug: 'brumbies',
  name: 'ACT Brumbies',
  city: 'Canberra',
  ground: 'Canberra Stadium',
  cityImages: [images.canberraLake, images.canberraCity],
  intro:
    'Canberra’s Super Rugby team, drawing players from the ACT and southern New South Wales, where club rugby is played for the John I Dent Cup.',
  honours: [
    card(images.celebration, 'Super Rugby champions 2001'),
    card(images.stadiumStands, 'Super Rugby champions 2004'),
    card(
      images.canberraBalloons,
      'Home of the John I Dent Cup clubs',
      backHome,
    ),
  ],
});

const reds = club({
  slug: 'reds',
  name: 'Queensland Reds',
  city: 'Brisbane',
  ground: 'Suncorp Stadium',
  cityImages: [images.brisbaneBridge, images.brisbaneSkyline],
  intro:
    'Queensland’s Super Rugby team, playing at Suncorp Stadium in Brisbane.',
  honours: [
    card(images.celebration, 'Super Rugby champions 2011'),
    card(
      images.brisbaneRiver,
      'Brisbane’s club rugby: the Hospital Cup',
      backHome,
    ),
  ],
});

const waratahs = club({
  slug: 'waratahs',
  name: 'NSW Waratahs',
  city: 'Sydney',
  ground: 'Allianz Stadium',
  cityImages: [images.sydneyHarbour, images.sydneyAerial],
  intro:
    'New South Wales’ Super Rugby team, in sky blue, playing at Allianz Stadium in Sydney.',
  honours: [
    card(images.celebration, 'Super Rugby champions 2014'),
    card(
      images.sydneyAerial,
      'Sydney’s club rugby: the Shute Shield',
      backHome,
    ),
  ],
});

const force = club({
  slug: 'western-force',
  name: 'Western Force',
  city: 'Perth',
  ground: 'HBF Park',
  cityImages: [images.perthCity, images.perthAerial],
  intro:
    'Western Australia’s Super Rugby team since 2006, playing at HBF Park in Perth. The black and gold come from the state’s traditional colours.',
  honours: [
    card(images.stadiumSunny, '2006: first Super Rugby season'),
    card(
      images.perthAerial,
      'Opening match of Rugby World Cup 2027 in Perth',
      backHome,
    ),
  ],
});

// ------------------------------------------------- state and territory unions

type Union = {
  slug: string;
  state: string;
  competition: string;
  images: [SeedImage, SeedImage];
};

function union(body: Union): SeedPage[] {
  const clubsLink = link('Find a club', '/clubs');
  return [
    page(body.slug, '/', 'Home', `Club and community rugby in ${body.state}.`, [
      node('imageSlider', {
        autoplay: false,
        slides: [
          slide(
            body.images[0],
            `Rugby in ${body.state}`,
            'Juniors, seniors, women and veterans: everyone is welcome.',
            clubsLink,
          ),
          slide(
            images.ballField,
            'Registrations are open',
            'Sign up for the new season at your local club.',
            clubsLink,
          ),
        ],
      }),
      columns(
        'Get involved',
        'There is a place in rugby for everyone.',
        'light',
        [
          card(images.match, 'Play', clubsLink),
          card(images.carry, 'Coach'),
          card(images.breakaway, 'Referee'),
        ],
      ),
      node('cardGrid', {
        title: 'Club rugby',
        variant: 'grid',
        cards: [
          card(images.stadiumStands, body.competition),
          card(images.womenPlaying, 'Women’s club rugby'),
          card(images.ballMorning, 'Junior rugby'),
        ],
      }),
    ]),
    page(
      body.slug,
      '/clubs',
      'Find a club',
      `Rugby clubs across ${body.state}.`,
      [
        node(
          'section',
          {
            heading: 'Find a club',
            intro: `Clubs across ${body.state} run teams for every age and level.`,
            layout: 'two-column',
            background: 'brand',
          },
          [
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [card(body.images[1], 'Metropolitan clubs')],
            }),
            node('cardGrid', {
              title: '',
              variant: 'grid',
              cards: [card(images.ballLeaves, 'Country clubs', backHome)],
            }),
          ],
        ),
      ],
    ),
  ];
}

const unions = [
  union({
    slug: 'nsw-rugby',
    state: 'New South Wales',
    competition: 'Shute Shield',
    images: [images.sydneyAerial, images.sydneyHarbour],
  }),
  union({
    slug: 'queensland-rugby',
    state: 'Queensland',
    competition: 'Hospital Cup',
    images: [images.brisbaneSkyline, images.brisbaneRiver],
  }),
  union({
    slug: 'rugby-victoria',
    state: 'Victoria',
    competition: 'Dewar Shield',
    images: [images.melbourneSkyline, images.melbourneBridge],
  }),
  union({
    slug: 'rugby-wa',
    state: 'Western Australia',
    competition: 'Premier Grade',
    images: [images.perthAerial, images.perthCity],
  }),
  union({
    slug: 'rugby-south-australia',
    state: 'South Australia',
    competition: 'Premier Grade',
    images: [images.adelaideStadium, images.adelaideCity],
  }),
  union({
    slug: 'tasmanian-rugby',
    state: 'Tasmania',
    competition: 'Statewide club competition',
    images: [images.hobartHarbour, images.hobartAerial],
  }),
  union({
    slug: 'nt-rugby',
    state: 'the Northern Territory',
    competition: 'Darwin and Central Australian clubs',
    images: [images.topEndBeach, images.uluru],
  }),
];

export const pages: SeedPage[] = [
  ...governingBody(),
  ...wallabies,
  ...wallaroos,
  ...sevens,
  ...brumbies,
  ...reds,
  ...waratahs,
  ...force,
  ...unions.flat(),
];
