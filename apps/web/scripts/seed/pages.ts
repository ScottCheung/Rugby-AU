import { randomUUID } from 'node:crypto';
import type { ComponentType, PropsOf } from '../../lib/components/registry';
import type { PageDocument } from '../../lib/db/documents';
import type { ComponentNode } from '../../lib/types';
import { images, type SeedImage } from './images';
import { photoPicker } from './photos';

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
type Pick = ReturnType<typeof photoPicker>;
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

/** Paragraphs are separated by an empty line, as editors type them. */
const text = (heading: string, paragraphs: string[], button?: Link) =>
  node('textBlock', {
    heading,
    body: paragraphs.join('\n\n'),
    ...(button ? { button } : {}),
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

/** Text on the left, a picture card on the right. */
const story = (background: Background, textBlock: ComponentNode, side: Card) =>
  node('section', { layout: 'two-column-wide', background }, [
    textBlock,
    node('cardGrid', { title: '', variant: 'grid', cards: [side] }),
  ]);

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

/** Photos without links: clicking one opens it full size. */
const gallery = (title: string, photos: SeedImage[]) =>
  node('cardGrid', {
    title,
    variant: 'masonry',
    cards: photos.map((image) => card(image, image.alt)),
  });

/** Ways to get involved, shared by the governing body and the unions. */
const getInvolvedCards = (
  pick: Pick,
  play: Link,
  coach: Link,
  referee: Link,
): Card[] => [
  card(
    pick('juniors'),
    'Play',
    'Juniors start with non-contact games and move to tackle rugby as they grow. Senior, women’s and veterans’ teams train once or twice a week.',
    play,
  ),
  card(
    pick('coaching'),
    'Coach',
    'Start with a free introductory course, then build your accreditation as your team moves up the age groups.',
    coach,
  ),
  card(
    pick('action'),
    'Referee',
    'Referees are needed every weekend. Courses cover the laws, positioning and game management, with a mentor for your first matches.',
    referee,
  ),
];

const backHome = link('Back to home', '/');

// ---------------------------------------------------------- governing body

function governingBody(pick: Pick): SeedPage[] {
  const slug = 'rugby-australia';
  const teams = link('Our teams', '/teams');
  const events = link('Major events', '/events');
  const involved = link('Get involved', '/get-involved');
  const competitions = link('Competitions', '/competitions');
  const about = link('About us', '/about');
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
              pick('crowd'),
              'Rugby World Cup 2027 is coming home',
              'Australia hosts the men’s tournament from 1 October to 13 November 2027, with the final in Sydney.',
              events,
            ),
            slide(
              pick('women'),
              'Women’s Rugby World Cup 2029',
              'Two years later, Australia welcomes the world’s best women’s teams.',
              events,
            ),
            slide(
              pick('juniors'),
              'Rugby for everyone',
              'From under 6s to veterans, there is a club near you.',
              involved,
            ),
          ],
        }),
        story(
          'none',
          text(
            'One game, played everywhere',
            [
              'Rugby union is played in every state and territory, from Test matches in front of full stadiums to Saturday mornings at the local club.',
              'Rugby Australia looks after all of it: the national teams, professional rugby, and the clubs, schools and volunteers who keep the community game going.',
            ],
            about,
          ),
          card(
            pick('team'),
            'A decade of big events',
            'Two home World Cups are on the way.',
            events,
          ),
        ),
        cards('Our teams', 'Four levels of rugby, one game.', 'carousel', [
          card(pick('stadium'), 'Wallabies', 'The men’s national team.', teams),
          card(pick('women'), 'Wallaroos', 'The women’s national team.', teams),
          card(
            images.sevensLineout,
            'Australia Sevens',
            'Men’s and women’s sevens.',
            teams,
          ),
          card(
            pick('setPiece'),
            'Super Rugby clubs',
            'Brumbies, Reds, Waratahs and Force.',
            teams,
          ),
          card(
            pick('juniors'),
            'Community rugby',
            'Clubs in every state and territory.',
            involved,
          ),
        ]),
        columns(
          'Get involved',
          'Play, coach, referee or help out at your local club.',
          'light',
          getInvolvedCards(pick, involved, involved, involved),
        ),
        feature(
          'Competitions',
          undefined,
          card(
            pick('stadium'),
            'From Test rugby to Saturday club games',
            'The Rugby Championship, Super Rugby Pacific, Super W and the club competitions in every state.',
            competitions,
          ),
          card(
            pick('trophy'),
            'Silverware',
            'The trophies Australian teams play for.',
            competitions,
          ),
        ),
        gallery('Around the country', [
          images.sydneyAerial,
          images.brisbaneBridge,
          images.canberraBalloons,
          images.perthCity,
          images.melbourneSkyline,
          images.adelaideStadium,
          images.hobartHarbour,
          images.uluru,
        ]),
      ],
    ),
    page(
      slug,
      '/about',
      'About us',
      'Who we are and how rugby is organised in Australia.',
      [
        banner(
          pick('stadium'),
          'About Rugby Australia',
          'The national governing body for rugby union in Australia.',
        ),
        text('Who we are', [
          'Rugby Australia is the national governing body for rugby union. It selects and runs the national teams, organises Australia’s part in professional competitions, and supports the community game in every state and territory.',
          'Most of its work happens out of sight: training coaches and referees, setting safety rules for junior rugby, funding development programmes, and helping clubs find and keep volunteers.',
          'It also bids for and hosts major events. The men’s Rugby World Cup in 2027 and the women’s in 2029 will both be played in Australia.',
        ]),
        columns(
          'What we do',
          'From the national teams down to the first training session at a local club.',
          'light',
          [
            card(
              pick('setPiece'),
              'National teams',
              'The Wallabies, Wallaroos, Australia Sevens and the youth teams that feed them.',
              teams,
            ),
            card(
              pick('crowd'),
              'Professional rugby',
              'Australia’s four Super Rugby Pacific clubs and the Super W women’s competition.',
              competitions,
            ),
            card(
              pick('juniors'),
              'Community rugby',
              'Courses, insurance and support for the clubs and schools where most rugby is played.',
              involved,
            ),
          ],
        ),
        feature(
          'How rugby is organised',
          'A partnership between the national body, the state and territory unions, and the clubs.',
          card(
            images.sydneyAerial,
            'State and territory unions',
            'Each state and territory has its own union, running club competitions, representative teams and development programmes.',
            competitions,
          ),
          card(
            pick('volunteers'),
            'Clubs and volunteers',
            'Volunteers run most clubs, with teams for juniors, seniors, women and veterans.',
            involved,
          ),
        ),
        cards(
          'A decade of major events',
          undefined,
          'grid',
          [
            card(
              pick('crowd'),
              'Men’s Rugby World Cup 2027',
              'Hosted across Australia, with the final in Sydney.',
              events,
            ),
            card(
              pick('women'),
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
          pick('team'),
          'Our teams',
          'From the Wallabies and Wallaroos to the next generation coming through.',
        ),
        text('Many teams, one pathway', [
          'Australia’s teams range from the Wallabies and Wallaroos to under 20s, sevens squads and four professional clubs.',
          'They are connected by one pathway. Players are spotted at school and club level, move through state age-group teams and club academies, and the best go on to wear the gold jersey.',
        ]),
        cards('National teams', undefined, 'grid', [
          card(
            pick('stadium'),
            'Wallabies',
            'The men’s national team, first capped in 1899 and Rugby World Cup winners in 1991 and 1999.',
            competitions,
          ),
          card(
            pick('women'),
            'Wallaroos',
            'The women’s national team, playing Test rugby since 1994.',
            competitions,
          ),
          card(
            images.sevensLineout,
            'Australia Sevens',
            'Men’s and women’s sevens. The women won the first Olympic rugby sevens gold at Rio 2016.',
            competitions,
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
              competitions,
            ),
            card(
              images.brisbaneBridge,
              'Queensland Reds',
              'Brisbane. Super Rugby champions in 2011.',
              competitions,
            ),
            card(
              images.sydneyHarbour,
              'NSW Waratahs',
              'Sydney. Super Rugby champions in 2014.',
              competitions,
            ),
            card(
              images.perthCity,
              'Western Force',
              'Perth. In Super Rugby since 2006.',
              competitions,
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
              pick('juniors'),
              'Schools and juniors',
              'State age-group championships are where many future internationals are first spotted.',
              involved,
            ),
            card(
              pick('coaching'),
              'Academies',
              'Each Super Rugby club runs an academy for young players in its region.',
              involved,
            ),
            card(
              pick('action'),
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
          pick('crowd'),
          'Competitions',
          'Test rugby, Super Rugby and the club games played every weekend.',
        ),
        text('Rugby all year round', [
          'Australian rugby runs on three levels. Test matches bring the national teams together against the best in the world. Super Rugby Pacific and Super W are the professional and elite club competitions.',
          'Underneath them are the state club competitions, played every weekend through autumn and winter, where most players and most supporters spend their Saturdays.',
        ]),
        cards('International', undefined, 'grid', [
          card(
            pick('setPiece'),
            'The Rugby Championship',
            'An annual tournament between Australia, New Zealand, South Africa and Argentina.',
            teams,
          ),
          card(
            pick('trophy'),
            'The Bledisloe Cup',
            'Contested between Australia and New Zealand since 1932.',
            teams,
          ),
          card(
            pick('women'),
            'Pacific Four Series',
            'The Wallaroos against Canada, New Zealand and the United States.',
            teams,
          ),
        ]),
        feature(
          'Professional',
          undefined,
          card(
            pick('stadium'),
            'Super Rugby Pacific',
            'Clubs from Australia, New Zealand and the Pacific Islands play a home-and-away season and finals.',
            teams,
          ),
          card(
            pick('women'),
            'Super W',
            'The national women’s competition, played since 2018.',
            teams,
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
              involved,
            ),
            card(
              images.brisbaneRiver,
              'Hospital Cup',
              'Brisbane’s premier club competition.',
              involved,
            ),
            card(
              images.canberraCity,
              'John I Dent Cup',
              'Canberra’s premier club competition.',
              involved,
            ),
            card(
              images.melbourneBridge,
              'Dewar Shield',
              'Melbourne’s premier club competition.',
              involved,
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
          pick('juniors'),
          'Get involved',
          'There is a role in rugby for everyone, on and off the field.',
        ),
        story(
          'none',
          text('Start this season', [
            'You don’t need experience to join a rugby club. Most clubs welcome new players at any time of the season and will find a team that suits your age and level.',
            'If playing isn’t for you, clubs always need coaches, referees, managers and helpers. Every role comes with free training.',
          ]),
          card(
            pick('team'),
            'Find your team',
            'Juniors, seniors, women and veterans.',
            teams,
          ),
        ),
        columns(
          'On the field',
          'Courses run through the year.',
          'light',
          getInvolvedCards(pick, teams, about, competitions),
        ),
        feature(
          'Off the field',
          undefined,
          card(
            pick('volunteers'),
            'Volunteer',
            'Team managers, first aiders, canteen helpers and committee members keep every club running.',
            about,
          ),
          card(
            pick('coaching'),
            'Schools',
            'Coaching visits and programmes help teachers introduce rugby safely.',
            teams,
          ),
        ),
        cards('Rugby for every age', undefined, 'carousel', [
          card(
            pick('juniors'),
            'Under 6 to under 12',
            'Non-contact and modified games that build skills and confidence.',
            teams,
          ),
          card(
            pick('juniors'),
            'Teenagers',
            'Full rugby with age and size rules to keep it safe.',
            teams,
          ),
          card(
            pick('women'),
            'Women and girls',
            'Teams at every level, from first-timers to Super W.',
            teams,
          ),
          card(
            pick('team'),
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
          pick('crowd'),
          'Major events',
          'A decade of world-class rugby in Australia.',
        ),
        text('World Cups at home', [
          'Australia hosts the men’s Rugby World Cup from 1 October to 13 November 2027, the first time since 2003. The tournament opens in Perth and finishes with the final in Sydney.',
          'In 2029 the Women’s Rugby World Cup comes to Australia for the first time, a chance to grow the women’s game in every state.',
        ]),
        feature(
          'Rugby World Cup 2027',
          undefined,
          card(
            pick('stadium'),
            '1 October to 13 November 2027',
            'Matches in cities across the country, with the final in Sydney.',
            teams,
          ),
          card(
            images.perthAerial,
            'Opening match in Perth',
            'The tournament starts in Western Australia.',
            teams,
          ),
          'light',
        ),
        feature(
          'Women’s Rugby World Cup 2029',
          undefined,
          card(
            pick('women'),
            'A home World Cup for the Wallaroos',
            'More teams, more coaches and more girls playing.',
            involved,
          ),
          card(
            pick('trophy'),
            'Building towards 2029',
            'How clubs can get ready.',
            involved,
          ),
        ),
        cards('Recent events', undefined, 'grid', [
          card(
            pick('setPiece'),
            '2025: the British & Irish Lions tour',
            'The Lions toured Australia for the first time since 2013.',
            teams,
          ),
          card(
            pick('crowd'),
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
  story: string[];
  moments: Card[];
  news: Card[];
  timeline: Card[];
  competitions: Card[];
};

function nationalTeam(team: NationalTeam, pick: Pick): SeedPage[] {
  const history = link('Our history', '/history');
  const matches = link('Matches', '/matches');
  const supporters = link('Supporters', '/supporters');
  return [
    page(team.slug, '/', 'Home', 'News, history and the road ahead.', [
      node('imageSlider', { autoplay: true, slides: team.slides }),
      story(
        'none',
        text(`About the ${team.name}`, team.story.slice(0, 2), history),
        card(
          pick('crowd'),
          'Become a member',
          'Priority tickets for every home Test.',
          supporters,
        ),
      ),
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
            cards: [
              card(
                pick('stadium'),
                'Next up: a home Test',
                'Members get first access to tickets.',
                supporters,
              ),
            ],
          }),
        ],
      ),
      gallery('Gallery', [
        pick('action'),
        pick('setPiece'),
        pick('team'),
        pick('action'),
        pick('crowd'),
        pick('action'),
      ]),
    ]),
    page(team.slug, '/history', 'History', 'Where the team comes from.', [
      banner(pick('team'), 'Our history', team.story[0]),
      text('The story so far', team.story),
      cards(
        'Timeline',
        'Swipe through the milestones.',
        'carousel',
        team.timeline,
        'light',
      ),
      columns(
        'What the jersey means',
        'Every player who pulls on the jersey joins a long line.',
        'none',
        [
          card(
            pick('team'),
            'A numbered cap',
            'Each player gets a cap number on debut, counting every international since the first.',
            matches,
          ),
          card(
            pick('action'),
            'Green and gold',
            'Australia’s sporting colours, worn with pride at home and away.',
            supporters,
          ),
          card(
            pick('juniors'),
            'From the clubs',
            'Every international started at a local club.',
            supporters,
          ),
        ],
      ),
    ]),
    page(team.slug, '/matches', 'Matches', 'Competitions and match days.', [
      banner(
        pick('crowd'),
        'Matches',
        'Test rugby at home and around the world.',
      ),
      cards('Competitions', undefined, 'grid', team.competitions),
      story(
        'light',
        text(
          'A Test match day',
          [
            'Gates usually open two hours before kick-off. Arrive early to watch the warm-ups, find your seat and be there for the anthems.',
            'Most stadiums are easiest to reach by public transport, and match tickets often include travel on the day. Check your ticket before you set out.',
          ],
          supporters,
        ),
        card(
          pick('stadium'),
          'Tickets',
          'Members get first access.',
          supporters,
        ),
      ),
    ]),
    page(team.slug, '/supporters', 'Supporters', `Follow the ${team.name}.`, [
      banner(
        pick('crowd'),
        `Support the ${team.name}`,
        'Wear the colours, join as a member and bring the family.',
      ),
      text(
        'Be part of it',
        [
          'Supporters are the sixth forward at a home Test. Members get priority tickets, member-only events and a say in the season’s awards.',
          'Junior members get a welcome pack and the chance to run out with the team at a home game.',
        ],
        matches,
      ),
      columns('Ways to support', 'Pick what suits you.', 'light', [
        card(
          pick('stadium'),
          'Membership',
          'Priority tickets for home Tests and member events through the year.',
          matches,
        ),
        card(
          pick('juniors'),
          'Kids',
          'A welcome pack and a chance to run out with the team.',
          history,
        ),
        card(
          pick('crowd'),
          'Travel',
          'Follow the team to away Tests with supporter tours.',
          backHome,
        ),
      ]),
      gallery('From the stands', [
        pick('crowd'),
        pick('action'),
        pick('team'),
        pick('setPiece'),
        pick('stadium'),
      ]),
    ]),
  ];
}

const historyLink = link('Our history', '/history');
const matchesLink = link('Matches', '/matches');

const wallabies = (pick: Pick) =>
  nationalTeam(
    {
      slug: 'wallabies',
      name: 'Wallabies',
      slides: [
        slide(
          pick('setPiece'),
          'Gold jersey, green and gold hearts',
          'The men’s national team has worn the gold jersey for generations.',
          historyLink,
        ),
        slide(
          pick('crowd'),
          'Road to Rugby World Cup 2027',
          'A home World Cup, with the final at Stadium Australia in Sydney.',
          matchesLink,
        ),
        slide(
          pick('action'),
          'The Bledisloe Cup',
          'The trans-Tasman rivalry with New Zealand.',
          matchesLink,
        ),
      ],
      story: [
        'Australia played its first Test in 1899, against a touring British Isles side at the Sydney Cricket Ground. The name Wallabies comes from the 1908 tour of Britain and has stayed with the men’s team ever since.',
        'The Wallabies won the Rugby World Cup in 1991 and again in 1999, the first team to lift the trophy twice. They have played New Zealand for the Bledisloe Cup since 1932, and meet New Zealand, South Africa and Argentina every year in The Rugby Championship.',
        'In 2027 the Rugby World Cup returns to Australia for the first time since 2003.',
      ],
      moments: [
        card(
          pick('ball'),
          '1899: the first Test',
          'Against the British Isles at the Sydney Cricket Ground.',
          historyLink,
        ),
        card(
          pick('team'),
          '1991: world champions',
          'Australia beat England in the final at Twickenham.',
          historyLink,
        ),
        card(
          pick('trophy'),
          '1999: champions again',
          'Australia beat France in the final in Cardiff.',
          historyLink,
        ),
        card(
          pick('setPiece'),
          'The Bledisloe Cup',
          'Played against New Zealand since 1932.',
          matchesLink,
        ),
        card(
          pick('crowd'),
          'The Rugby Championship',
          'Every year against New Zealand, South Africa and Argentina.',
          matchesLink,
        ),
      ],
      news: [
        card(
          pick('action'),
          'Squad named for the next Test window',
          'A mix of experienced players and new faces.',
          matchesLink,
        ),
        card(
          pick('coaching'),
          'Young players called into camp',
          'Under 20s and academy players train with the squad.',
          historyLink,
        ),
      ],
      timeline: [
        card(
          pick('ball'),
          '1899',
          'First Test, against the British Isles in Sydney.',
          matchesLink,
        ),
        card(
          pick('team'),
          '1908',
          'The touring team to Britain becomes known as the Wallabies.',
          matchesLink,
        ),
        card(
          pick('setPiece'),
          '1932',
          'The Bledisloe Cup is first contested with New Zealand.',
          matchesLink,
        ),
        card(
          pick('trophy'),
          '1991',
          'Rugby World Cup winners at Twickenham.',
          matchesLink,
        ),
        card(
          pick('team'),
          '1999',
          'Rugby World Cup winners again, in Cardiff.',
          matchesLink,
        ),
        card(
          pick('crowd'),
          '2003',
          'Hosts of the Rugby World Cup, finishing runners-up.',
          matchesLink,
        ),
        card(pick('stadium'), '2027', 'A home Rugby World Cup.', matchesLink),
      ],
      competitions: [
        card(
          pick('crowd'),
          'The Rugby Championship',
          'Home and away against New Zealand, South Africa and Argentina.',
          historyLink,
        ),
        card(
          pick('trophy'),
          'The Bledisloe Cup',
          'The trophy at stake whenever Australia play New Zealand.',
          historyLink,
        ),
        card(
          pick('stadium'),
          'Spring tour',
          'Tests in Europe at the end of the year.',
          historyLink,
        ),
      ],
    },
    pick,
  );

const wallaroos = (pick: Pick) =>
  nationalTeam(
    {
      slug: 'wallaroos',
      name: 'Wallaroos',
      slides: [
        slide(
          pick('women'),
          'The Wallaroos',
          'Australia’s women’s fifteens team, playing Test rugby since 1994.',
          historyLink,
        ),
        slide(
          pick('women'),
          'Women’s Rugby World Cup 2029',
          'A home World Cup is on the way.',
          matchesLink,
        ),
      ],
      story: [
        'The Wallaroos played their first Test on 2 September 1994, against New Zealand in Sydney. Four years later they made their first Rugby World Cup appearance.',
        'Their best World Cup finish is third place, in 2010. Since 2018 Super W has given the country’s best players a national club competition and a clearer path into the Wallaroos.',
        'In 2029 Australia hosts the Women’s Rugby World Cup for the first time.',
      ],
      moments: [
        card(
          pick('women'),
          '1994: first Test',
          'Against New Zealand at North Sydney Oval.',
          historyLink,
        ),
        card(
          pick('women'),
          '1998: first Rugby World Cup',
          'The start of Australia’s World Cup story.',
          historyLink,
        ),
        card(
          pick('women'),
          '2010: third in the world',
          'The Wallaroos’ best Rugby World Cup finish.',
          historyLink,
        ),
        card(
          pick('crowd'),
          '2029: a home World Cup',
          'The first women’s Rugby World Cup in Australia.',
          matchesLink,
        ),
      ],
      news: [
        card(
          pick('women'),
          'Squad named for the international season',
          'Players from across the Super W clubs.',
          matchesLink,
        ),
        card(
          pick('coaching'),
          'Pathway players join the national camp',
          'The next generation trains with the squad.',
          historyLink,
        ),
      ],
      timeline: [
        card(
          pick('women'),
          '1994',
          'First Test, against New Zealand in Sydney.',
          matchesLink,
        ),
        card(
          pick('women'),
          '1998',
          'First Rugby World Cup appearance.',
          matchesLink,
        ),
        card(
          pick('trophy'),
          '2010',
          'Third place at the Rugby World Cup.',
          matchesLink,
        ),
        card(
          pick('women'),
          '2018',
          'Super W begins, giving players a national club competition.',
          matchesLink,
        ),
        card(pick('stadium'), '2029', 'A home Rugby World Cup.', matchesLink),
      ],
      competitions: [
        card(
          pick('women'),
          'Pacific Four Series',
          'Against Canada, New Zealand and the United States.',
          historyLink,
        ),
        card(
          pick('crowd'),
          'WXV',
          'World Rugby’s global women’s competition.',
          historyLink,
        ),
        card(
          pick('trophy'),
          'Rugby World Cup',
          'Every four years, with 2029 at home.',
          historyLink,
        ),
      ],
    },
    pick,
  );

const sevens = (pick: Pick) =>
  nationalTeam(
    {
      slug: 'australia-sevens',
      name: 'Australia Sevens',
      slides: [
        slide(
          images.sevensLineout,
          'Fast, open, seven a side',
          'Australia’s men’s and women’s sevens teams.',
          historyLink,
        ),
        slide(
          pick('women'),
          'Olympic champions',
          'Australia’s women won the first Olympic rugby sevens gold, at Rio 2016.',
          historyLink,
        ),
      ],
      story: [
        'Sevens is rugby at full speed: seven players a side and seven-minute halves, with tournaments played over a weekend.',
        'Rugby sevens joined the Olympic Games at Rio 2016, where Australia’s women won the first gold medal, beating New Zealand in the final.',
        'Both teams play a world series of tournaments every season, and the pathway runs from schools and clubs to state and national squads.',
      ],
      moments: [
        card(
          pick('women'),
          'Rio 2016: Olympic gold',
          'The women won the first Olympic rugby sevens final.',
          historyLink,
        ),
        card(
          pick('action'),
          'A world series every year',
          'Tournaments on several continents through the season.',
          matchesLink,
        ),
        card(
          pick('juniors'),
          'Pathways for young players',
          'Sevens is a fast route into international rugby.',
          historyLink,
        ),
      ],
      news: [
        card(
          pick('action'),
          'Squads named for the next tournament',
          'Both teams travel together.',
          matchesLink,
        ),
        card(
          pick('coaching'),
          'Training camp on the Gold Coast',
          'A week of speed and conditioning work.',
          historyLink,
        ),
      ],
      timeline: [
        card(
          pick('action'),
          'The game',
          'Seven players a side, seven-minute halves.',
          matchesLink,
        ),
        card(
          pick('trophy'),
          '2016',
          'Women’s Olympic gold at Rio.',
          matchesLink,
        ),
        card(
          pick('crowd'),
          'Every season',
          'A world series of tournaments around the globe.',
          matchesLink,
        ),
      ],
      competitions: [
        card(
          pick('action'),
          'World series',
          'A season of weekend tournaments on several continents.',
          historyLink,
        ),
        card(
          pick('trophy'),
          'Olympic Games',
          'Rugby sevens has been an Olympic sport since 2016.',
          historyLink,
        ),
        card(
          pick('stadium'),
          'Commonwealth Games',
          'Sevens is part of the Commonwealth Games programme.',
          historyLink,
        ),
      ],
    },
    pick,
  );

// --------------------------------------------------------- Super Rugby clubs

type Club = {
  slug: string;
  name: string;
  city: string;
  ground: string;
  region: string;
  cityImages: [SeedImage, SeedImage];
  story: string[];
  honours: { year: string; text: string }[];
};

function club(team: Club, pick: Pick): SeedPage[] {
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
              pick('crowd'),
              `Home games at ${team.ground}`,
              'Bring the family and wear the colours.',
              matchday,
            ),
            slide(
              pick('action'),
              'The new season',
              'Memberships are on sale now.',
              matchday,
            ),
          ],
        }),
        story(
          'none',
          text(`Welcome to the ${team.name}`, team.story.slice(0, 2), clubLink),
          card(pick('team'), 'Our honours', 'Titles and milestones.', clubLink),
        ),
        columns('This season', 'Everything you need for match day.', 'light', [
          card(
            pick('stadium'),
            'Memberships',
            'Your seat for every home game.',
            matchday,
          ),
          card(
            pick('crowd'),
            'Tickets',
            'Single-game tickets for every home match.',
            matchday,
          ),
          card(
            pick('juniors'),
            'Junior clinics',
            'Holiday clinics run by the club’s coaches.',
            pathways,
          ),
        ]),
        feature(
          'Home ground',
          undefined,
          card(
            pick('stadium'),
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
        gallery('Gallery', [
          pick('action'),
          team.cityImages[0],
          pick('setPiece'),
          pick('action'),
          pick('team'),
        ]),
      ],
    ),
    page(team.slug, '/club', 'The club', `The story of the ${team.name}.`, [
      banner(team.cityImages[0], `About the ${team.name}`, team.story[0]),
      text('Our story', team.story),
      cards(
        'Honours and milestones',
        undefined,
        'carousel',
        team.honours.map((honour) =>
          card(pick('team'), honour.year, honour.text, matchday),
        ),
        'brand',
      ),
      columns(
        'More than one team',
        'The club looks after rugby across its region.',
        'none',
        [
          card(
            pick('action'),
            'Super Rugby Pacific',
            'The men’s team, against the best clubs in Australia, New Zealand and the Pacific.',
            matchday,
          ),
          card(
            pick('women'),
            'Super W',
            'The women’s team in the national women’s competition.',
            matchday,
          ),
          card(
            pick('coaching'),
            'Academy',
            `Young players from across ${team.region}.`,
            pathways,
          ),
        ],
      ),
    ]),
    page(team.slug, '/matchday', 'Match day', `Home games at ${team.ground}.`, [
      banner(
        pick('crowd'),
        'Match day',
        `Everything you need for a home game at ${team.ground}.`,
      ),
      story(
        'none',
        text('Plan your day', [
          `Gates at ${team.ground} open well before kick-off, with activities for kids on the concourse and the warm-ups to watch.`,
          'Public transport is the easiest way to get there on game day. Members keep the same seat all season, and single tickets go on sale before each game.',
        ]),
        card(
          team.cityImages[1],
          'Getting there',
          `Travel tips for ${team.ground}.`,
          clubLink,
        ),
      ),
      columns('Before you go', 'Tickets, seats and family days.', 'light', [
        card(
          pick('stadium'),
          'Tickets and memberships',
          'Members keep the same seat all season.',
          clubLink,
        ),
        card(
          pick('juniors'),
          'Kids go cheap',
          'Discounted tickets for children, and a family zone at every home game.',
          pathways,
        ),
        card(
          pick('team'),
          'Meet the players',
          'Signing sessions after selected games.',
          clubLink,
        ),
      ]),
    ]),
    page(
      team.slug,
      '/pathways',
      'Pathways',
      `From club rugby to the ${team.name}.`,
      [
        banner(
          pick('juniors'),
          'Pathways',
          `How young players in ${team.region} reach professional rugby.`,
        ),
        text('From the local club to Super Rugby', [
          `Every player in the ${team.name} squad started at a local club. Talented juniors are picked for representative age-group teams, and the best join the club’s academy.`,
          'The academy adds coaching, strength and conditioning, and support with school or work, so players are ready when their chance comes.',
        ]),
        cards(
          'The route to the top',
          undefined,
          'carousel',
          [
            card(
              pick('juniors'),
              'Club rugby',
              'Every player starts at a local club.',
              matchday,
            ),
            card(
              pick('coaching'),
              'Junior clinics',
              'Holiday clinics run by the club’s coaches.',
              matchday,
            ),
            card(
              pick('action'),
              'Representative teams',
              'Age-group teams that play other states.',
              matchday,
            ),
            card(
              pick('coaching'),
              'Academy',
              'Training, strength and conditioning, and study support.',
              clubLink,
            ),
            card(
              pick('stadium'),
              'Debut',
              `Pulling on the ${team.name} jersey.`,
              backHome,
            ),
          ],
          'light',
        ),
        columns(
          'Women’s pathway',
          'Girls can follow the same route, all the way to Super W.',
          'none',
          [
            card(
              pick('women'),
              'Club and school',
              'Girls’ teams at every age.',
              matchday,
            ),
            card(
              pick('women'),
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

const brumbies = (pick: Pick) =>
  club(
    {
      slug: 'brumbies',
      name: 'ACT Brumbies',
      city: 'Canberra',
      ground: 'Canberra Stadium',
      region: 'the ACT and southern New South Wales',
      cityImages: [images.canberraLake, images.canberraCity],
      story: [
        'The Brumbies have been Canberra’s Super Rugby team since the competition began in 1996, drawing players from the ACT and southern New South Wales.',
        'They won Super Rugby in 2001 and 2004, and the Super Rugby AU title in 2020. Club rugby in the region is played for the John I Dent Cup.',
        'Home games are at Canberra Stadium, where the club also runs its junior clinics and community days.',
      ],
      honours: [
        { year: '1996', text: 'The club plays its first Super Rugby season.' },
        { year: '2001', text: 'Super Rugby champions.' },
        { year: '2004', text: 'Super Rugby champions again.' },
        { year: '2020', text: 'Super Rugby AU champions.' },
      ],
    },
    pick,
  );

const reds = (pick: Pick) =>
  club(
    {
      slug: 'reds',
      name: 'Queensland Reds',
      city: 'Brisbane',
      ground: 'Suncorp Stadium',
      region: 'Queensland',
      cityImages: [images.brisbaneBridge, images.brisbaneSkyline],
      story: [
        'Queensland’s rugby story goes back to 1882, when Queensland and New South Wales played their first interstate match. Today the Reds are Queensland’s Super Rugby team.',
        'The Reds won Super Rugby in 2011 and the Super Rugby AU title in 2021. Club rugby in Brisbane is played for the Hospital Cup.',
        'Home games are at Suncorp Stadium in Brisbane.',
      ],
      honours: [
        {
          year: '1882',
          text: 'Queensland and New South Wales play their first interstate match.',
        },
        { year: '2011', text: 'Super Rugby champions.' },
        { year: '2021', text: 'Super Rugby AU champions.' },
      ],
    },
    pick,
  );

const waratahs = (pick: Pick) =>
  club(
    {
      slug: 'waratahs',
      name: 'NSW Waratahs',
      city: 'Sydney',
      ground: 'Allianz Stadium',
      region: 'New South Wales',
      cityImages: [images.sydneyHarbour, images.sydneyAerial],
      story: [
        'New South Wales has played representative rugby since 1882, when it first met Queensland. The Waratahs, in sky blue, are the state’s Super Rugby team.',
        'They won Super Rugby in 2014. Sydney’s club competition, the Shute Shield, is where many Waratahs come from.',
        'Home games are at Allianz Stadium in Sydney.',
      ],
      honours: [
        {
          year: '1882',
          text: 'New South Wales and Queensland play their first interstate match.',
        },
        { year: '2014', text: 'Super Rugby champions.' },
        {
          year: 'Shute Shield',
          text: 'Sydney’s club competition feeds the Waratahs.',
        },
      ],
    },
    pick,
  );

const force = (pick: Pick) =>
  club(
    {
      slug: 'western-force',
      name: 'Western Force',
      city: 'Perth',
      ground: 'HBF Park',
      region: 'Western Australia',
      cityImages: [images.perthCity, images.perthAerial],
      story: [
        'The Western Force have been Western Australia’s Super Rugby team since 2006. The black and gold come from the state’s traditional colours.',
        'After time outside the competition, the Force returned to Super Rugby in 2020. Home games are at HBF Park in Perth.',
        'In 2027 Perth hosts the opening match of the Rugby World Cup.',
      ],
      honours: [
        { year: '2006', text: 'The club plays its first Super Rugby season.' },
        { year: '2020', text: 'Back in Super Rugby, in Super Rugby AU.' },
        {
          year: '2027',
          text: 'Perth hosts the opening match of the Rugby World Cup.',
        },
      ],
    },
    pick,
  );

// ------------------------------------------------- state and territory unions

type Union = {
  slug: string;
  state: string;
  competition: string;
  images: [SeedImage, SeedImage];
};

function union(body: Union, pick: Pick): SeedPage[] {
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
            pick('juniors'),
            'Registrations are open',
            'Sign up for the new season at your local club.',
            involved,
          ),
        ],
      }),
      story(
        'none',
        text(
          'Your local game',
          [
            `Rugby in ${body.state} is played by juniors, seniors, women and veterans at clubs in the city and the country.`,
            'We run the competitions, train the coaches and referees, and help clubs with everything from insurance to finding volunteers.',
          ],
          clubsLink,
        ),
        card(
          pick('team'),
          'New this season',
          'Registrations are open at every club.',
          involved,
        ),
      ),
      columns(
        'Get involved',
        'There is a place in rugby for everyone.',
        'light',
        getInvolvedCards(pick, clubsLink, involved, involved),
      ),
      cards('Club rugby', undefined, 'grid', [
        card(
          pick('action'),
          body.competition,
          'The top level of club rugby in the state.',
          competitions,
        ),
        card(
          pick('women'),
          'Women’s club rugby',
          'Fifteens and sevens competitions.',
          competitions,
        ),
        card(
          pick('juniors'),
          'Junior rugby',
          'Teams from under 6s to under 18s.',
          competitions,
        ),
      ]),
      gallery('Around the clubs', [
        pick('action'),
        body.images[1],
        pick('juniors'),
        pick('setPiece'),
        pick('volunteers'),
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
        text('Choosing a club', [
          'The best club is usually the closest one. Most have junior, senior and women’s teams, and all of them welcome beginners.',
          'Call in at a training night before you register: you can meet the coaches, try a session and see which team suits you.',
        ]),
        columns(
          'Where to play',
          'Most clubs have junior, senior and women’s teams.',
          'light',
          [
            card(
              body.images[0],
              'Metropolitan clubs',
              'City clubs play in the premier competitions, with several grades each weekend.',
              competitions,
            ),
            card(
              pick('ball'),
              'Country clubs',
              'Regional clubs play in local competitions and come together for country championships.',
              competitions,
            ),
          ],
        ),
        feature(
          'What to expect',
          undefined,
          card(
            pick('coaching'),
            'Your first session',
            'Turn up in sports clothes and boots. Mouthguards are a must for contact training.',
            involved,
          ),
          card(
            pick('team'),
            'Registration',
            'Register online once you have chosen a club.',
            involved,
          ),
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
          pick('coaching'),
          'Get involved',
          'Rugby runs on players, coaches, referees and volunteers.',
        ),
        text(
          'There is a role for you',
          [
            'Clubs need more than players. Coaches, referees, team managers, first aiders and canteen helpers all make game day happen.',
            'Courses for coaches and referees run through the year, and most are free for club members.',
          ],
          clubsLink,
        ),
        columns(
          'On the field',
          'Courses run through the year.',
          'light',
          getInvolvedCards(pick, clubsLink, clubsLink, competitions),
        ),
        feature(
          'Off the field',
          undefined,
          card(
            pick('volunteers'),
            'Volunteer',
            'Team managers, first aiders and canteen helpers keep every club running.',
            clubsLink,
          ),
          card(
            pick('juniors'),
            'Schools',
            'Coaching visits and programmes for primary and secondary schools.',
            backHome,
          ),
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
          pick('action'),
          'Competitions',
          `Club rugby in ${body.state}, from juniors to the top grade.`,
        ),
        text('How the season works', [
          'The club season runs through autumn and winter, with finals at the end. Senior clubs field several grades, so players of every standard get a game.',
          'Junior competitions are organised by age, with rules that change as players grow: non-contact games for the youngest, then modified tackle rugby, then the full game.',
        ]),
        cards('Senior rugby', undefined, 'grid', [
          card(
            pick('action'),
            body.competition,
            'The top club competition, with several grades on match days.',
            clubsLink,
          ),
          card(
            pick('women'),
            'Women’s rugby',
            'Fifteens in winter and sevens in summer.',
            clubsLink,
          ),
          card(
            pick('team'),
            'Veterans',
            'Social rugby for players over 35.',
            clubsLink,
          ),
        ]),
        cards(
          'Junior rugby',
          'Age groups from under 6 to under 18.',
          'carousel',
          [
            card(
              pick('juniors'),
              'Under 6 to under 9',
              'Non-contact games that teach the basics.',
              clubsLink,
            ),
            card(
              pick('juniors'),
              'Under 10 to under 12',
              'Modified tackle rugby on smaller fields.',
              clubsLink,
            ),
            card(
              pick('juniors'),
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

const unions: Union[] = [
  {
    slug: 'nsw-rugby',
    state: 'New South Wales',
    competition: 'Shute Shield',
    images: [images.sydneyAerial, images.sydneyHarbour],
  },
  {
    slug: 'queensland-rugby',
    state: 'Queensland',
    competition: 'Hospital Cup',
    images: [images.brisbaneSkyline, images.brisbaneRiver],
  },
  {
    slug: 'rugby-victoria',
    state: 'Victoria',
    competition: 'Dewar Shield',
    images: [images.melbourneSkyline, images.melbourneBridge],
  },
  {
    slug: 'rugby-wa',
    state: 'Western Australia',
    competition: 'Premier Grade',
    images: [images.perthAerial, images.perthCity],
  },
  {
    slug: 'rugby-south-australia',
    state: 'South Australia',
    competition: 'Premier Grade',
    images: [images.adelaideStadium, images.adelaideCity],
  },
  {
    slug: 'tasmanian-rugby',
    state: 'Tasmania',
    competition: 'Statewide club competition',
    images: [images.hobartHarbour, images.hobartAerial],
  },
  {
    slug: 'nt-rugby',
    state: 'the Northern Territory',
    competition: 'Darwin and Central Australian clubs',
    images: [images.topEndBeach, images.uluru],
  },
];

// Each site gets its own photo picker, so sites start on different photos.
const builders: ((pick: Pick) => SeedPage[])[] = [
  governingBody,
  wallabies,
  wallaroos,
  sevens,
  brumbies,
  reds,
  waratahs,
  force,
  ...unions.map((body) => (pick: Pick) => union(body, pick)),
];

export const pages: SeedPage[] = builders.flatMap((build, index) =>
  build(photoPicker(index)),
);
