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
type Background = PropsOf<'section'>['background'];
export type SeedPage = Omit<PageDocument, '_id'>;

/** Typed helper: the compiler checks seed props against each component's schema. */
function node<Type extends ComponentType>(
  type: Type,
  props: PropsOf<Type>,
  children?: ComponentNode[],
): ComponentNode {
  return { id: randomUUID(), type, props, ...(children ? { children } : {}) };
}

const card = (
  image: SeedImage,
  heading: string,
  text?: string,
  link?: Link,
): Card => ({
  image,
  heading,
  ...(text ? { text } : {}),
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

// ------------------------------------------------------------ building blocks

/** A single-slide Image Slider used as a page header. */
const banner = (image: SeedImage, heading: string, text: string) =>
  node('imageSlider', {
    autoplay: false,
    slides: [slide(image, heading, text)],
  });

/** A Section holding one Card Grid. */
const cards = (
  heading: string,
  intro: string | undefined,
  variant: 'grid' | 'carousel' | 'masonry',
  items: Card[],
  background: Background = 'none',
) =>
  node(
    'section',
    { heading, ...(intro ? { intro } : {}), layout: 'full', background },
    [node('cardGrid', { title: '', variant, cards: items })],
  );

/** One card per column, e.g. "Play / Coach / Referee". */
const columns = (
  heading: string,
  intro: string,
  background: Background,
  items: Card[],
) =>
  node(
    'section',
    {
      heading,
      intro,
      layout: items.length === 2 ? 'two-column' : 'three-column',
      background,
    },
    items.map((item) =>
      node('cardGrid', { title: '', variant: 'grid', cards: [item] }),
    ),
  );

/** A wide feature on the left and a smaller one on the right. */
const feature = (
  heading: string,
  intro: string | undefined,
  main: Card,
  side: Card,
  background: Background = 'none',
) =>
  node(
    'section',
    {
      heading,
      ...(intro ? { intro } : {}),
      layout: 'two-column-wide',
      background,
    },
    [
      node('cardGrid', { title: '', variant: 'grid', cards: [main] }),
      node('cardGrid', { title: '', variant: 'grid', cards: [side] }),
    ],
  );

const gallery = (photos: SeedImage[]) =>
  node('cardGrid', {
    title: 'Gallery',
    variant: 'masonry',
    cards: photos.map((image) => card(image, image.alt)),
  });

/** Ways to get involved, shared by the governing body and the unions. */
const getInvolvedCards = (findClub: Link): Card[] => [
  card(
    images.match,
    'Play',
    'Juniors start with non-contact games and move to tackle rugby as they grow. Senior, women’s and veterans’ teams train once or twice a week.',
    findClub,
  ),
  card(
    images.carry,
    'Coach',
    'Start with a free introductory course, then build your accreditation as your team moves up the age groups.',
  ),
  card(
    images.breakaway,
    'Referee',
    'Referees are needed every weekend. Courses cover the laws, positioning and game management, with a mentor for your first matches.',
  ),
];

const backHome = link('Back to home', '/');

// ---------------------------------------------------------- governing body

function governingBody(): SeedPage[] {
  const slug = 'rugby-australia';
  const teams = link('Our teams', '/teams');
  const events = link('Major events', '/events');
  const involved = link('Get involved', '/get-involved');
  const competitions = link('Competitions', '/competitions');
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
              events,
            ),
            slide(
              images.womenPlaying,
              'Women’s Rugby World Cup 2029',
              'Two years later, Australia welcomes the world’s best women’s teams.',
              events,
            ),
            slide(
              images.celebration,
              'Rugby for everyone',
              'From under 6s to veterans, there is a club near you.',
              involved,
            ),
          ],
        }),
        cards('Our teams', 'Four levels of rugby, one game.', 'carousel', [
          card(images.stadium, 'Wallabies', 'The men’s national team.', teams),
          card(
            images.womenJerseys,
            'Wallaroos',
            'The women’s national team.',
            teams,
          ),
          card(
            images.pass,
            'Australia Sevens',
            'Men’s and women’s sevens.',
            teams,
          ),
          card(
            images.scrum,
            'Super Rugby clubs',
            'Brumbies, Reds, Waratahs and Force.',
            teams,
          ),
          card(
            images.ballField,
            'Community rugby',
            'Clubs in every state and territory.',
            involved,
          ),
        ]),
        columns(
          'Get involved',
          'Play, coach, referee or help out at your local club.',
          'light',
          getInvolvedCards(involved),
        ),
        feature(
          'Competitions',
          undefined,
          card(
            images.stadiumStands,
            'From Test rugby to Saturday club games',
            'The Rugby Championship, Super Rugby Pacific, Super W and the club competitions in every state.',
            competitions,
          ),
          card(
            images.stadiumSunny,
            'Who we are',
            'The national body for rugby union in Australia.',
            link('About us', '/about'),
          ),
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
      'About us',
      'Who we are and how rugby is organised in Australia.',
      [
        banner(
          images.stadium,
          'About Rugby Australia',
          'The national governing body for rugby union in Australia.',
        ),
        columns(
          'What we do',
          'We look after the game from the national teams down to the first training session at a local club.',
          'none',
          [
            card(
              images.scrum,
              'National teams',
              'The Wallabies, Wallaroos, Australia Sevens and the youth teams that feed them.',
              teams,
            ),
            card(
              images.stadiumStands,
              'Professional rugby',
              'Australia’s four Super Rugby Pacific clubs and the Super W women’s competition.',
              competitions,
            ),
            card(
              images.ballField,
              'Community rugby',
              'Courses, insurance and support for the clubs and schools where most rugby is played.',
              involved,
            ),
          ],
        ),
        feature(
          'How rugby is organised',
          'Rugby in Australia is a partnership between the national body, the state and territory unions, and the clubs.',
          card(
            images.sydneyAerial,
            'State and territory unions',
            'Each state and territory has its own union, running club competitions, representative teams and development programmes.',
          ),
          card(
            images.ballMorning,
            'Clubs and schools',
            'Volunteers run most clubs, with teams for juniors, seniors, women and veterans.',
          ),
          'light',
        ),
        cards(
          'A decade of major events',
          undefined,
          'grid',
          [
            card(
              images.stadiumNight,
              'Men’s Rugby World Cup 2027',
              'Hosted across Australia, with the final in Sydney.',
              events,
            ),
            card(
              images.womenPlaying,
              'Women’s Rugby World Cup 2029',
              'The first women’s Rugby World Cup in Australia.',
              events,
            ),
          ],
          'brand',
        ),
      ],
    ),
    page(
      slug,
      '/teams',
      'Teams',
      'Australia’s national teams and professional clubs.',
      [
        banner(
          images.stadiumSunny,
          'Our teams',
          'From the Wallabies and Wallaroos to the next generation coming through.',
        ),
        cards('National teams', undefined, 'grid', [
          card(
            images.stadium,
            'Wallabies',
            'The men’s national team, first capped in 1899 and Rugby World Cup winners in 1991 and 1999.',
          ),
          card(
            images.womenJerseys,
            'Wallaroos',
            'The women’s national team, playing Test rugby since 1994.',
          ),
          card(
            images.pass,
            'Australia Sevens',
            'Men’s and women’s sevens. The women won the first Olympic rugby sevens gold at Rio 2016.',
          ),
        ]),
        cards(
          'Professional clubs',
          'Four Australian teams play in Super Rugby Pacific, and each also fields a side in Super W.',
          'carousel',
          [
            card(
              images.canberraLake,
              'ACT Brumbies',
              'Canberra. Super Rugby champions in 2001 and 2004.',
            ),
            card(
              images.brisbaneBridge,
              'Queensland Reds',
              'Brisbane. Super Rugby champions in 2011.',
            ),
            card(
              images.sydneyHarbour,
              'NSW Waratahs',
              'Sydney. Super Rugby champions in 2014.',
            ),
            card(
              images.perthCity,
              'Western Force',
              'Perth. In Super Rugby since 2006.',
            ),
          ],
          'light',
        ),
        columns(
          'Pathways',
          'The route from club rugby to the national teams.',
          'none',
          [
            card(
              images.ballMorning,
              'Schools and juniors',
              'State age-group championships are where many future internationals are first spotted.',
            ),
            card(
              images.breakaway,
              'Academies',
              'Each Super Rugby club runs an academy for young players in its region.',
            ),
            card(
              images.tackle,
              'Under 20s',
              'Australia’s under 20 team plays against the best young players in the world.',
              involved,
            ),
          ],
        ),
      ],
    ),
    page(
      slug,
      '/competitions',
      'Competitions',
      'International, professional and club competitions.',
      [
        banner(
          images.stadiumNight,
          'Competitions',
          'Test rugby, Super Rugby and the club games played every weekend.',
        ),
        cards('International', undefined, 'grid', [
          card(
            images.scrum,
            'The Rugby Championship',
            'An annual tournament between Australia, New Zealand, South Africa and Argentina.',
          ),
          card(
            images.stadiumStands,
            'The Bledisloe Cup',
            'Contested between Australia and New Zealand since 1932.',
          ),
          card(
            images.womenPlaying,
            'Pacific Four Series',
            'The Wallaroos against Canada, New Zealand and the United States.',
          ),
        ]),
        feature(
          'Professional',
          undefined,
          card(
            images.stadiumSunny,
            'Super Rugby Pacific',
            'Clubs from Australia, New Zealand and the Pacific Islands play a home-and-away season and finals.',
            teams,
          ),
          card(
            images.womenJerseys,
            'Super W',
            'The national women’s competition, played since 2018.',
          ),
          'light',
        ),
        cards(
          'Club rugby',
          'Every state runs its own club competition.',
          'carousel',
          [
            card(
              images.sydneyAerial,
              'Shute Shield',
              'Sydney’s premier club competition.',
            ),
            card(
              images.brisbaneRiver,
              'Hospital Cup',
              'Brisbane’s premier club competition.',
            ),
            card(
              images.canberraCity,
              'John I Dent Cup',
              'Canberra’s premier club competition.',
            ),
            card(
              images.melbourneBridge,
              'Dewar Shield',
              'Melbourne’s premier club competition.',
            ),
            card(
              images.perthAerial,
              'Premier Grade',
              'The top club grade in Perth and Adelaide.',
              involved,
            ),
          ],
        ),
      ],
    ),
    page(
      slug,
      '/get-involved',
      'Get involved',
      'Play, coach, referee or volunteer.',
      [
        banner(
          images.ballField,
          'Get involved',
          'There is a role in rugby for everyone, on and off the field.',
        ),
        columns(
          'On the field',
          'Most clubs welcome new players at any time of the season.',
          'none',
          getInvolvedCards(link('See the teams', '/teams')),
        ),
        feature(
          'Off the field',
          undefined,
          card(
            images.stadiumSeats,
            'Volunteer',
            'Team managers, first aiders, canteen helpers and committee members keep every club running.',
          ),
          card(
            images.ballLeaves,
            'Schools',
            'Coaching visits and programmes help teachers introduce rugby safely.',
          ),
          'light',
        ),
        cards('Rugby for every age', undefined, 'carousel', [
          card(
            images.ballMorning,
            'Under 6 to under 12',
            'Non-contact and modified games that build skills and confidence.',
          ),
          card(
            images.tackle,
            'Teenagers',
            'Full rugby with age and size rules to keep it safe.',
          ),
          card(
            images.womenPlaying,
            'Women and girls',
            'Teams at every level, from first-timers to Super W.',
          ),
          card(
            images.celebration,
            'Veterans',
            'Social rugby for players over 35.',
            backHome,
          ),
        ]),
      ],
    ),
    page(
      slug,
      '/events',
      'Major events',
      'Rugby World Cups and tours coming to Australia.',
      [
        banner(
          images.stadiumNight,
          'Major events',
          'A decade of world-class rugby in Australia.',
        ),
        feature(
          'Rugby World Cup 2027',
          'The men’s tournament returns to Australia for the first time since 2003.',
          card(
            images.stadium,
            '1 October to 13 November 2027',
            'Matches in cities across the country, with the final in Sydney.',
          ),
          card(
            images.perthAerial,
            'Opening match in Perth',
            'The tournament starts in Western Australia.',
          ),
        ),
        feature(
          'Women’s Rugby World Cup 2029',
          'Australia hosts the women’s tournament for the first time.',
          card(
            images.womenPlaying,
            'A home World Cup for the Wallaroos',
            'A chance to grow the women’s game in every state.',
            involved,
          ),
          card(
            images.stadiumStands,
            'Building towards 2029',
            'More teams, more coaches and more girls playing.',
          ),
          'light',
        ),
        cards('Recent events', undefined, 'grid', [
          card(
            images.scrum,
            '2025: the British & Irish Lions tour',
            'The Lions toured Australia for the first time since 2013.',
          ),
          card(
            images.celebration,
            '2003: Rugby World Cup',
            'The last time Australia hosted the men’s tournament.',
            backHome,
          ),
        ]),
      ],
    ),
  ];
}

// ---------------------------------------------------------- national teams

type NationalTeam = {
  slug: string;
  name: string;
  slides: Slide[];
  moments: Card[];
  news: Card[];
  nextUp: Card;
  gallery: SeedImage[];
  history: { image: SeedImage; intro: string; timeline: Card[] };
  matches: { intro: string; competitions: Card[] };
};

function nationalTeam(team: NationalTeam): SeedPage[] {
  const matches = link('Matches', '/matches');
  const supporters = link('Supporters', '/supporters');
  return [
    page(team.slug, '/', 'Home', 'News, history and the road ahead.', [
      node('imageSlider', { autoplay: true, slides: team.slides }),
      cards(
        'Moments',
        'Swipe through some of the milestones.',
        'carousel',
        team.moments,
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
      gallery(team.gallery),
    ]),
    page(team.slug, '/history', 'History', 'Where the team comes from.', [
      banner(team.history.image, 'Our history', team.history.intro),
      cards(
        'Timeline',
        'Swipe through the milestones.',
        'carousel',
        team.history.timeline,
      ),
      columns(
        'What the jersey means',
        'Every player who pulls on the jersey joins a long line.',
        'light',
        [
          card(
            images.womenJerseys,
            'A numbered cap',
            'Each player gets a cap number on debut, counting every international since the first.',
          ),
          card(
            images.celebration,
            'Green and gold',
            'Australia’s sporting colours, worn with pride at home and away.',
          ),
          card(
            images.ballField,
            'From the clubs',
            'Every international started at a local club.',
            supporters,
          ),
        ],
      ),
    ]),
    page(team.slug, '/matches', 'Matches', 'Competitions and match days.', [
      banner(images.stadiumNight, 'Matches', team.matches.intro),
      cards('Competitions', undefined, 'grid', team.matches.competitions),
      feature(
        'At the ground',
        undefined,
        card(
          images.stadiumStands,
          'Match day',
          'Gates usually open two hours before kick-off. Arrive early for the warm-ups and the anthems.',
        ),
        card(
          images.stadiumSeats,
          'Tickets',
          'Members get first access to home Tests.',
          supporters,
        ),
        'light',
      ),
    ]),
    page(team.slug, '/supporters', 'Supporters', `Follow the ${team.name}.`, [
      banner(
        images.celebration,
        `Support the ${team.name}`,
        'Wear the colours, join as a member and bring the family.',
      ),
      columns('Ways to support', 'Pick what suits you.', 'none', [
        card(
          images.stadiumSeats,
          'Membership',
          'Priority tickets for home Tests and member events through the year.',
          matches,
        ),
        card(
          images.ballMorning,
          'Kids',
          'Junior members get a welcome pack and the chance to run out with the team.',
        ),
        card(
          images.stadiumSunny,
          'Travel',
          'Follow the team to away Tests with supporter tours.',
          backHome,
        ),
      ]),
      gallery(team.gallery),
    ]),
  ];
}

const historyLink = link('Our history', '/history');
const matchesLink = link('Matches', '/matches');
const memberLink = link('Become a member', '/supporters');

const wallabies = nationalTeam({
  slug: 'wallabies',
  name: 'Wallabies',
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
      matchesLink,
    ),
    slide(
      images.scrum,
      'The Bledisloe Cup',
      'The trans-Tasman rivalry with New Zealand.',
      matchesLink,
    ),
  ],
  moments: [
    card(
      images.ballLeaves,
      '1899: the first Test',
      'Against the British Isles at the Sydney Cricket Ground.',
      historyLink,
    ),
    card(
      images.celebration,
      '1991: world champions',
      'Australia beat England in the final at Twickenham.',
      historyLink,
    ),
    card(
      images.stadiumStands,
      '1999: champions again',
      'Australia beat France in the final in Cardiff.',
      historyLink,
    ),
    card(
      images.scrum,
      'The Bledisloe Cup',
      'Played against New Zealand since 1932.',
      matchesLink,
    ),
    card(
      images.stadiumNight,
      'The Rugby Championship',
      'Every year against New Zealand, South Africa and Argentina.',
      matchesLink,
    ),
  ],
  news: [
    card(
      images.tackle,
      'Squad named for the next Test window',
      'A mix of experienced players and new faces.',
      matchesLink,
    ),
    card(
      images.carry,
      'Young players called into camp',
      'Under 20s and academy players train with the squad.',
      historyLink,
    ),
  ],
  nextUp: card(
    images.stadiumSunny,
    'Next up: a home Test',
    'Members get first access to tickets.',
    memberLink,
  ),
  gallery: [
    images.stadium,
    images.scrum,
    images.tackle,
    images.celebration,
    images.ball,
    images.stadiumStands,
  ],
  history: {
    image: images.ballLeaves,
    intro: 'From the first Test in 1899 to two Rugby World Cup titles.',
    timeline: [
      card(
        images.ballLeaves,
        '1899',
        'First Test, against the British Isles in Sydney.',
      ),
      card(
        images.stadium,
        '1908',
        'The touring team to Britain becomes known as the Wallabies.',
      ),
      card(
        images.scrum,
        '1932',
        'The Bledisloe Cup is first contested with New Zealand.',
      ),
      card(
        images.celebration,
        '1991',
        'Rugby World Cup winners at Twickenham.',
      ),
      card(
        images.stadiumStands,
        '1999',
        'Rugby World Cup winners again, in Cardiff.',
      ),
      card(
        images.stadiumNight,
        '2003',
        'Hosts of the Rugby World Cup, finishing runners-up.',
      ),
      card(images.stadiumSunny, '2027', 'A home Rugby World Cup.', matchesLink),
    ],
  },
  matches: {
    intro: 'Test rugby at home and around the world.',
    competitions: [
      card(
        images.stadiumNight,
        'The Rugby Championship',
        'Home and away against New Zealand, South Africa and Argentina.',
      ),
      card(
        images.scrum,
        'The Bledisloe Cup',
        'The trophy at stake whenever Australia play New Zealand.',
      ),
      card(
        images.stadiumStands,
        'Spring tour',
        'Tests in Europe at the end of the year.',
      ),
    ],
  },
});

const wallaroos = nationalTeam({
  slug: 'wallaroos',
  name: 'Wallaroos',
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
      matchesLink,
    ),
  ],
  moments: [
    card(
      images.womenJerseys,
      '1994: first Test',
      'Against New Zealand at North Sydney Oval.',
      historyLink,
    ),
    card(
      images.womenPlaying,
      '1998: first Rugby World Cup',
      'The start of Australia’s World Cup story.',
      historyLink,
    ),
    card(
      images.celebration,
      '2010: third in the world',
      'The Wallaroos’ best Rugby World Cup finish.',
      historyLink,
    ),
    card(
      images.stadiumStands,
      '2029: a home World Cup',
      'The first women’s Rugby World Cup in Australia.',
      matchesLink,
    ),
  ],
  news: [
    card(
      images.pass,
      'Squad named for the international season',
      'Players from across the Super W clubs.',
      matchesLink,
    ),
    card(
      images.breakaway,
      'Pathway players join the national camp',
      'The next generation trains with the squad.',
      historyLink,
    ),
  ],
  nextUp: card(
    images.stadiumSunny,
    'Next up: a home Test',
    'Bring the family.',
    memberLink,
  ),
  gallery: [
    images.womenPlaying,
    images.womenJerseys,
    images.celebration,
    images.ballField,
    images.stadiumSeats,
  ],
  history: {
    image: images.womenJerseys,
    intro:
      'The Wallaroos played their first Test on 2 September 1994 against the Black Ferns in Sydney.',
    timeline: [
      card(
        images.womenJerseys,
        '1994',
        'First Test, against New Zealand in Sydney.',
      ),
      card(images.womenPlaying, '1998', 'First Rugby World Cup appearance.'),
      card(images.celebration, '2010', 'Third place at the Rugby World Cup.'),
      card(
        images.stadiumStands,
        '2018',
        'Super W begins, giving players a national club competition.',
      ),
      card(images.stadiumSunny, '2029', 'A home Rugby World Cup.', matchesLink),
    ],
  },
  matches: {
    intro: 'Test rugby against the best teams in the world.',
    competitions: [
      card(
        images.womenPlaying,
        'Pacific Four Series',
        'Against Canada, New Zealand and the United States.',
      ),
      card(
        images.stadiumNight,
        'WXV',
        'World Rugby’s global women’s competition.',
      ),
      card(
        images.stadiumStands,
        'Rugby World Cup',
        'Every four years, with 2029 at home.',
      ),
    ],
  },
});

const sevens = nationalTeam({
  slug: 'australia-sevens',
  name: 'Australia Sevens',
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
    card(
      images.celebration,
      'Rio 2016: Olympic gold',
      'The women won the first Olympic rugby sevens final.',
      historyLink,
    ),
    card(
      images.breakaway,
      'A world series every year',
      'Tournaments on several continents through the season.',
      matchesLink,
    ),
    card(
      images.pass,
      'Pathways for young players',
      'Sevens is a fast route into international rugby.',
      historyLink,
    ),
  ],
  news: [
    card(
      images.breakaway,
      'Squads named for the next tournament',
      'Both teams travel together.',
      matchesLink,
    ),
    card(
      images.carry,
      'Training camp on the Gold Coast',
      'A week of speed and conditioning work.',
      historyLink,
    ),
  ],
  nextUp: card(
    images.stadiumSeats,
    'Next up: a world series weekend',
    'Two days, both teams, non-stop rugby.',
    memberLink,
  ),
  gallery: [
    images.pass,
    images.breakaway,
    images.celebration,
    images.ballMorning,
    images.stadiumSunny,
  ],
  history: {
    image: images.pass,
    intro:
      'Sevens became an Olympic sport at Rio 2016, where Australia’s women won the first gold medal.',
    timeline: [
      card(
        images.pass,
        'The game',
        'Seven players a side, seven-minute halves.',
      ),
      card(images.celebration, '2016', 'Women’s Olympic gold at Rio.'),
      card(
        images.breakaway,
        'Every season',
        'A world series of tournaments around the globe.',
        matchesLink,
      ),
    ],
  },
  matches: {
    intro: 'Tournaments around the world, men and women together.',
    competitions: [
      card(
        images.breakaway,
        'World series',
        'A season of weekend tournaments on several continents.',
      ),
      card(
        images.celebration,
        'Olympic Games',
        'Rugby sevens has been an Olympic sport since 2016.',
      ),
      card(
        images.stadiumSunny,
        'Commonwealth Games',
        'Sevens is part of the Commonwealth Games programme.',
      ),
    ],
  },
});

// --------------------------------------------------------- Super Rugby clubs

type Club = {
  slug: string;
  name: string;
  city: string;
  ground: string;
  region: string;
  cityImages: [SeedImage, SeedImage];
  intro: string;
  honours: Card[];
};

function club(team: Club): SeedPage[] {
  const clubLink = link('About the club', '/club');
  const matchday = link('Match day', '/matchday');
  const pathways = link('Pathways', '/pathways');
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
              matchday,
            ),
          ],
        }),
        columns('This season', 'Everything you need for match day.', 'light', [
          card(
            images.stadiumStands,
            'Memberships',
            'Your seat for every home game.',
            matchday,
          ),
          card(
            images.stadiumSeats,
            'Tickets',
            'Single-game tickets for every home match.',
            matchday,
          ),
          card(
            images.ballMorning,
            'Junior clinics',
            'Holiday clinics run by the club’s coaches.',
            pathways,
          ),
        ]),
        feature(
          'Home ground',
          undefined,
          card(
            images.stadiumSunny,
            team.ground,
            `Where the ${team.name} play their home games.`,
            matchday,
          ),
          card(
            team.cityImages[1],
            team.city,
            `The heart of rugby in ${team.region}.`,
            clubLink,
          ),
        ),
        gallery([
          images.tackle,
          team.cityImages[0],
          images.scrum,
          images.celebration,
          images.ball,
        ]),
      ],
    ),
    page(team.slug, '/club', 'The club', `The story of the ${team.name}.`, [
      banner(team.cityImages[0], `About the ${team.name}`, team.intro),
      cards(
        'Honours and milestones',
        undefined,
        'carousel',
        team.honours,
        'brand',
      ),
      columns(
        'More than one team',
        'The club looks after rugby across its region.',
        'none',
        [
          card(
            images.stadium,
            'Super Rugby Pacific',
            'The men’s team, against the best clubs in Australia, New Zealand and the Pacific.',
            matchday,
          ),
          card(
            images.womenPlaying,
            'Super W',
            'The women’s team in the national women’s competition.',
          ),
          card(
            images.breakaway,
            'Academy',
            `Young players from across ${team.region}.`,
            pathways,
          ),
        ],
      ),
    ]),
    page(team.slug, '/matchday', 'Match day', `Home games at ${team.ground}.`, [
      banner(
        images.stadiumNight,
        'Match day',
        `Everything you need for a home game at ${team.ground}.`,
      ),
      columns('Before you go', 'Plan your day.', 'none', [
        card(
          images.stadiumSeats,
          'Tickets and memberships',
          'Members keep the same seat all season. Single tickets go on sale before each game.',
        ),
        card(
          team.cityImages[1],
          'Getting there',
          `Public transport is the easiest way to ${team.ground} on game day.`,
        ),
        card(
          images.stadiumStands,
          'Gates and kick-off',
          'Gates open well before kick-off, with activities for kids on the concourse.',
        ),
      ]),
      feature(
        'Families welcome',
        undefined,
        card(
          images.celebration,
          'Kids go cheap',
          'Discounted tickets for children, and a family zone at every home game.',
        ),
        card(
          images.ballMorning,
          'Meet the players',
          'Signing sessions after selected games.',
          clubLink,
        ),
        'light',
      ),
    ]),
    page(
      team.slug,
      '/pathways',
      'Pathways',
      `From club rugby to the ${team.name}.`,
      [
        banner(
          images.ballMorning,
          'Pathways',
          `How young players in ${team.region} reach professional rugby.`,
        ),
        cards('The route to the top', undefined, 'carousel', [
          card(
            images.ballField,
            'Club rugby',
            'Every player starts at a local club.',
          ),
          card(
            images.ballMorning,
            'Junior clinics',
            'Holiday clinics run by the club’s coaches.',
          ),
          card(
            images.tackle,
            'Representative teams',
            'Age-group teams that play other states.',
          ),
          card(
            images.breakaway,
            'Academy',
            'Training, strength and conditioning, and study support.',
          ),
          card(
            images.stadium,
            'Debut',
            `Pulling on the ${team.name} jersey.`,
            backHome,
          ),
        ]),
        columns(
          'Women’s pathway',
          'Girls can follow the same route, all the way to Super W.',
          'light',
          [
            card(
              images.womenPlaying,
              'Club and school',
              'Girls’ teams at every age.',
            ),
            card(
              images.womenJerseys,
              'Super W',
              'The club’s women’s team.',
              clubLink,
            ),
          ],
        ),
      ],
    ),
  ];
}

const brumbies = club({
  slug: 'brumbies',
  name: 'ACT Brumbies',
  city: 'Canberra',
  ground: 'Canberra Stadium',
  region: 'the ACT and southern New South Wales',
  cityImages: [images.canberraLake, images.canberraCity],
  intro:
    'Canberra’s Super Rugby team since 1996, drawing players from the ACT and southern New South Wales.',
  honours: [
    card(
      images.stadium,
      '1996',
      'The club plays its first Super Rugby season.',
    ),
    card(images.celebration, '2001', 'Super Rugby champions.'),
    card(images.stadiumStands, '2004', 'Super Rugby champions again.'),
    card(images.canberraBalloons, '2020', 'Super Rugby AU champions.'),
  ],
});

const reds = club({
  slug: 'reds',
  name: 'Queensland Reds',
  city: 'Brisbane',
  ground: 'Suncorp Stadium',
  region: 'Queensland',
  cityImages: [images.brisbaneBridge, images.brisbaneSkyline],
  intro:
    'Queensland’s Super Rugby team, playing at Suncorp Stadium in Brisbane.',
  honours: [
    card(
      images.ballLeaves,
      '1882',
      'Queensland and New South Wales play their first interstate match.',
    ),
    card(images.celebration, '2011', 'Super Rugby champions.'),
    card(images.stadiumStands, '2021', 'Super Rugby AU champions.'),
  ],
});

const waratahs = club({
  slug: 'waratahs',
  name: 'NSW Waratahs',
  city: 'Sydney',
  ground: 'Allianz Stadium',
  region: 'New South Wales',
  cityImages: [images.sydneyHarbour, images.sydneyAerial],
  intro:
    'New South Wales’ Super Rugby team, in sky blue, playing at Allianz Stadium in Sydney.',
  honours: [
    card(
      images.ballLeaves,
      '1882',
      'New South Wales and Queensland play their first interstate match.',
    ),
    card(images.celebration, '2014', 'Super Rugby champions.'),
    card(
      images.sydneyAerial,
      'The Shute Shield',
      'Sydney’s club competition feeds the Waratahs.',
    ),
  ],
});

const force = club({
  slug: 'western-force',
  name: 'Western Force',
  city: 'Perth',
  ground: 'HBF Park',
  region: 'Western Australia',
  cityImages: [images.perthCity, images.perthAerial],
  intro:
    'Western Australia’s Super Rugby team since 2006, playing at HBF Park in Perth. The black and gold come from the state’s traditional colours.',
  honours: [
    card(
      images.stadiumSunny,
      '2006',
      'The club plays its first Super Rugby season.',
    ),
    card(images.stadium, '2020', 'Back in Super Rugby, in Super Rugby AU.'),
    card(
      images.perthAerial,
      '2027',
      'Perth hosts the opening match of the Rugby World Cup.',
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
  const involved = link('Get involved', '/get-involved');
  const competitions = link('Competitions', '/competitions');
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
            involved,
          ),
        ],
      }),
      columns(
        'Get involved',
        'There is a place in rugby for everyone.',
        'light',
        getInvolvedCards(clubsLink),
      ),
      cards('Club rugby', undefined, 'grid', [
        card(
          images.stadiumStands,
          body.competition,
          'The top level of club rugby in the state.',
          competitions,
        ),
        card(
          images.womenPlaying,
          'Women’s club rugby',
          'Fifteens and sevens competitions.',
          competitions,
        ),
        card(
          images.ballMorning,
          'Junior rugby',
          'Teams from under 6s to under 18s.',
          competitions,
        ),
      ]),
    ]),
    page(
      body.slug,
      '/clubs',
      'Find a club',
      `Rugby clubs across ${body.state}.`,
      [
        banner(
          body.images[1],
          'Find a club',
          `Clubs across ${body.state} run teams for every age and level.`,
        ),
        columns(
          'Where to play',
          'Most clubs have junior, senior and women’s teams.',
          'none',
          [
            card(
              body.images[0],
              'Metropolitan clubs',
              'City clubs play in the premier competitions, with several grades each weekend.',
              competitions,
            ),
            card(
              images.ballLeaves,
              'Country clubs',
              'Regional clubs play in local competitions and come together for country championships.',
            ),
          ],
        ),
        feature(
          'What to expect',
          undefined,
          card(
            images.ballMorning,
            'Your first session',
            'Turn up in sports clothes and boots. Mouthguards are a must for contact training.',
          ),
          card(
            images.match,
            'Registration',
            'Register online once you have chosen a club.',
            involved,
          ),
          'light',
        ),
      ],
    ),
    page(
      body.slug,
      '/get-involved',
      'Get involved',
      `Play, coach, referee or volunteer in ${body.state}.`,
      [
        banner(
          images.ballField,
          'Get involved',
          'Rugby runs on players, coaches, referees and volunteers.',
        ),
        columns(
          'On the field',
          'Courses run through the year.',
          'none',
          getInvolvedCards(clubsLink),
        ),
        feature(
          'Off the field',
          undefined,
          card(
            images.stadiumSeats,
            'Volunteer',
            'Team managers, first aiders and canteen helpers keep every club running.',
          ),
          card(
            images.ballLeaves,
            'Schools',
            'Coaching visits and programmes for primary and secondary schools.',
            backHome,
          ),
          'light',
        ),
      ],
    ),
    page(
      body.slug,
      '/competitions',
      'Competitions',
      `Club competitions in ${body.state}.`,
      [
        banner(
          images.stadiumStands,
          'Competitions',
          `Club rugby in ${body.state}, from juniors to the top grade.`,
        ),
        cards('Senior rugby', undefined, 'grid', [
          card(
            images.stadiumStands,
            body.competition,
            'The top club competition, with several grades on match days.',
          ),
          card(
            images.womenPlaying,
            'Women’s rugby',
            'Fifteens in winter and sevens in summer.',
          ),
          card(
            images.celebration,
            'Veterans',
            'Social rugby for players over 35.',
          ),
        ]),
        cards(
          'Junior rugby',
          'Age groups from under 6 to under 18, with rules that change as players grow.',
          'carousel',
          [
            card(
              images.ballMorning,
              'Under 6 to under 9',
              'Non-contact games that teach the basics.',
            ),
            card(
              images.ballField,
              'Under 10 to under 12',
              'Modified tackle rugby on smaller fields.',
            ),
            card(
              images.tackle,
              'Under 13 to under 18',
              'Full rugby with age and weight rules.',
              clubsLink,
            ),
          ],
          'light',
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
