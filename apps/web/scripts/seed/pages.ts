import { randomUUID } from 'node:crypto';
import type { ComponentType, PropsOf } from '../../lib/components/registry';
import type { PageDocument } from '../../lib/db/documents';
import type { ComponentNode } from '../../lib/types';
import { images, type SeedImage } from './images';
import { formatDate } from '../../lib/news';
import { photoPicker } from './photos';
import { playerPhoto } from './players';
import { squads, type Squad, type SquadPlayer } from './squads';

/**
 * Page content for the sample sites. Each kind of site (governing body,
 * national team, Super Rugby club, state union) has one template filled in
 * with that site's facts, so adding a site is mostly adding data. The copy
 * is written for this demo from public facts; it is not taken from any site.
 */

type Card = PropsOf<'cardGrid'>['cards'][number];
type Variant = PropsOf<'cardGrid'>['variant'];
type Slide = PropsOf<'imageSlider'>['slides'][number];
type Stat = PropsOf<'stats'>['stats'][number];
type SectionProps = PropsOf<'section'>;
type Background = SectionProps['background'];
type Width = SectionProps['width'];
type Link = { label: string; href: string };
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
const stat = (value: string, label: string): Stat => ({ value, label });

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

/** A Section; anything not given takes the Section's own defaults. */
const section = (
  children: ComponentNode[],
  props: Partial<SectionProps> = {},
) =>
  node(
    'section',
    { layout: 'full', background: 'none', width: 'contained', ...props },
    children,
  );

const grid = (variant: Variant, cards: Card[], title = '') =>
  node('cardGrid', { title, variant, cards });

/** An Image Slider; edge to edge unless a width is given. */
const hero = (slides: Slide[], width: Width = 'full-width') =>
  section([node('imageSlider', { autoplay: slides.length > 1, slides })], {
    width,
  });

/** A one-slide header for an inner page. */
const banner = (
  image: SeedImage,
  heading: string,
  text: string,
  width: Width = 'full-width',
) => hero([slide(image, heading, text)], width);

/** Paragraphs are separated by an empty line, as editors type them. */
const text = (
  heading: string,
  paragraphs: string[],
  button?: Link,
  style: PropsOf<'textBlock'>['style'] = 'plain',
) =>
  node('textBlock', {
    heading,
    body: paragraphs.join('\n\n'),
    style,
    ...(button ? { button } : {}),
  });

/** A Section holding one Card Grid. */
const cards = (
  heading: string,
  intro: string | undefined,
  variant: Variant,
  items: Card[],
  background: Background = 'none',
  width: Width = 'contained',
) =>
  section([grid(variant, items)], {
    heading,
    ...(intro ? { intro } : {}),
    background,
    width,
  });

/** One card per column, e.g. "Play / Coach / Referee". */
const columns = (
  heading: string,
  intro: string,
  background: Background,
  items: Card[],
  width: Width = 'contained',
) =>
  section(
    items.map((item) => grid('grid', [item])),
    {
      heading,
      intro,
      layout: items.length === 2 ? 'two-column' : 'three-column',
      background,
      width,
    },
  );

/**
 * Text beside a picture card. `flip` puts the picture on the left, so
 * consecutive stories can alternate sides.
 */
const story = (
  background: Background,
  textBlock: ComponentNode,
  side: Card,
  flip = false,
  width: Width = 'contained',
) =>
  section(
    flip
      ? [grid('grid', [side]), textBlock]
      : [textBlock, grid('grid', [side])],
    {
      layout: flip ? 'two-column-wide-right' : 'two-column-wide',
      background,
      width,
    },
  );

/** A wide feature on the left and a smaller one on the right. */
const feature = (
  heading: string,
  intro: string | undefined,
  main: Card,
  side: Card,
  background: Background = 'none',
  width: Width = 'contained',
) =>
  section([grid('grid', [main]), grid('grid', [side])], {
    heading,
    ...(intro ? { intro } : {}),
    layout: 'two-column-wide',
    background,
    width,
  });

/** A band of big numbers, the colour running to the screen edges. */
const statsBand = (
  heading: string | undefined,
  items: Stat[],
  background: Background = 'brand',
) =>
  section([node('stats', { stats: items })], {
    ...(heading ? { heading } : {}),
    background,
    width: 'full-background',
  });

/** A centred call to action on a full-width band. */
const callout = (
  heading: string,
  paragraphs: string[],
  button: Link,
  background: Background = 'brand',
) =>
  section([text(heading, paragraphs, button, 'centered')], {
    background,
    width: 'full-background',
  });

/** Photos without links: clicking one opens it full size. */
const gallery = (
  title: string,
  photos: SeedImage[],
  width: Width = 'contained',
) =>
  section(
    [
      grid(
        'masonry',
        photos.map((image) => card(image, image.alt)),
      ),
    ],
    { heading: title, width },
  );

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

// ------------------------------------------------------------------ articles

type Category = PropsOf<'article'>['category'];

/** An article: evergreen copy built from facts, never an invented event. */
type Story = {
  slug: string;
  category: Category;
  date: string;
  headline: string;
  standfirst: string;
  image: SeedImage;
  /** Paragraphs; a paragraph starting with "## " is a subheading. */
  body: string[];
};

/** The data-driven Latest news block. */
const latest = (
  title: string,
  limit: number,
  display: PropsOf<'latestNews'>['display'],
  category?: Category,
) =>
  node('latestNews', {
    title,
    limit,
    display,
    ...(category ? { category } : {}),
  });

/** An article page: the story, then more news (which leaves this one out). */
const articlePage = (siteSlug: string, story: Story): SeedPage =>
  page(siteSlug, `/news/${story.slug}`, story.headline, story.standfirst, [
    node('article', {
      category: story.category,
      date: story.date,
      headline: story.headline,
      standfirst: story.standfirst,
      image: story.image,
      body: story.body.join('\n\n'),
    }),
    section([latest('More news', 3, 'grid')], {
      background: 'light',
      width: 'full-background',
    }),
  ]);

/** The site's news page and its article pages. */
const newsPages = (siteSlug: string, intro: string, stories: Story[]) => [
  page(siteSlug, '/news', 'News', intro, [
    section([text('News', [intro], undefined, 'centered')]),
    latest('', 12, 'featured'),
  ]),
  ...stories.map((story) => articlePage(siteSlug, story)),
];

/** Publish dates, newest first, a week apart. Sample content. */
const dates = ['2026-11-18', '2026-11-11', '2026-11-04', '2026-10-28'];

/** Rugby Australia's articles. */
const governingBodyStories = (pick: Pick): Story[] => [
  {
    slug: 'two-home-world-cups',
    category: 'Events',
    date: dates[0],
    headline: 'Two home World Cups: what’s coming in 2027 and 2029',
    standfirst:
      'Australia hosts the men’s Rugby World Cup in 2027 and the women’s in 2029. Here is what that means for fans and clubs.',
    image: pick('crowd'),
    body: [
      'For the rest of the decade, the biggest events in world rugby are coming to Australia. The men’s Rugby World Cup runs from 1 October to 13 November 2027, the first time the tournament has been played here since 2003.',
      '## Where the matches are',
      'The tournament opens in Perth and finishes with the final in Sydney, with pool matches in cities across the country. For many fans it will be the first chance to see the world’s best teams without leaving home.',
      '## 2029: a first for the women’s game',
      'Two years later, Australia hosts the Women’s Rugby World Cup for the first time. It is a chance to grow the women’s game in every state, from more girls’ teams at clubs to more women coaching and refereeing.',
      '## What it means for clubs',
      'Home tournaments tend to bring new players to local clubs. If your club is planning for the next few seasons, now is a good time to think about coaches, volunteers and room for new teams.',
    ],
  },
  {
    slug: 'bledisloe-cup-explained',
    category: 'Explainer',
    date: dates[1],
    headline: 'The Bledisloe Cup, explained',
    standfirst:
      'Australia and New Zealand have played for the Bledisloe Cup since 1932. Here is how the trophy works.',
    image: pick('trophy'),
    body: [
      'The Bledisloe Cup is the trophy at stake when the Wallabies play New Zealand. It has been contested since 1932 and is one of the best-known rivalries in the sport.',
      '## How it is won',
      'The cup is decided over the Tests the two countries play in a year. The holder keeps it unless the challenger wins the series, so a drawn series leaves the cup where it is.',
      '## Where it fits in the season',
      'Bledisloe Tests are usually played during The Rugby Championship, the annual tournament between Australia, New Zealand, South Africa and Argentina, so one match can count towards both.',
    ],
  },
  {
    slug: 'how-rugby-is-organised',
    category: 'Explainer',
    date: dates[2],
    headline: 'How rugby is organised in Australia',
    standfirst:
      'From the national teams to the local club, here is who looks after what.',
    image: pick('team'),
    body: [
      'Rugby in Australia is a partnership. Rugby Australia runs the national teams and the professional game, the state and territory unions run competitions in their regions, and clubs are where nearly everyone plays.',
      '## The national body',
      'Rugby Australia selects and manages the Wallabies, Wallaroos, Australia Sevens and youth teams, and organises Australia’s part in Super Rugby Pacific and Super W.',
      '## The states and territories',
      'Each state and territory has its own union. They run the club competitions, pick representative teams and look after coach and referee development.',
      '## The clubs',
      'Clubs, most of them run by volunteers, field teams for juniors, seniors, women and veterans. They are the first stop for anyone who wants to play.',
    ],
  },
  {
    slug: 'your-first-season',
    category: 'Community',
    date: dates[3],
    headline: 'Your first season at a rugby club',
    standfirst:
      'Never played before? Here is what to expect from your first few weeks.',
    image: pick('juniors'),
    body: [
      'Most clubs welcome new players at any time of the season, and you don’t need any experience. Coaches will find a team that suits your age, size and level.',
      '## What to bring',
      'Sports clothes, boots and a water bottle are enough for the first session. A mouthguard is a must once you start contact training.',
      '## How training works',
      'Teams usually train once or twice a week, with games on the weekend. Younger juniors play non-contact and modified games that build skills before tackling is introduced.',
    ],
  },
];

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
        hero([
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
        ]),
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
        statsBand('Australian rugby in numbers', [
          stat('1899', 'First Test match'),
          stat('2', 'Men’s Rugby World Cup titles'),
          stat('2016', 'Olympic sevens gold for the women'),
          stat('2027', 'A home Rugby World Cup'),
        ]),
        cards('Our teams', 'Four levels of rugby, one game.', 'overlay', [
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
        ]),
        columns(
          'Get involved',
          'Play, coach, referee or help out at your local club.',
          'light',
          getInvolvedCards(pick, involved, involved, involved),
          'full-background',
        ),
        latest('Latest news', 3, 'featured'),
        cards('Competitions', undefined, 'featured', [
          card(
            pick('stadium'),
            'From Test rugby to Saturday club games',
            'The Rugby Championship, Super Rugby Pacific, Super W and the club competitions in every state.',
            competitions,
          ),
          card(
            pick('trophy'),
            'The Bledisloe Cup',
            'Australia against New Zealand since 1932.',
            competitions,
          ),
          card(
            pick('women'),
            'Super W',
            'The national women’s competition.',
            competitions,
          ),
        ]),
        gallery(
          'Around the country',
          [
            images.sydneyAerial,
            images.brisbaneBridge,
            images.canberraBalloons,
            images.perthCity,
            images.melbourneSkyline,
            images.adelaideStadium,
            images.hobartHarbour,
            images.uluru,
          ],
          'full-width',
        ),
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
        story(
          'none',
          text('Who we are', [
            'Rugby Australia is the national governing body for rugby union. It selects and runs the national teams, organises Australia’s part in professional competitions, and supports the community game in every state and territory.',
            'Most of its work happens out of sight: training coaches and referees, setting safety rules for junior rugby, funding development programmes, and helping clubs find and keep volunteers.',
          ]),
          card(
            pick('team'),
            'Major events',
            'Two home World Cups this decade.',
            events,
          ),
        ),
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
          'full-background',
        ),
        story(
          'none',
          text('How rugby is organised', [
            'Rugby in Australia is a partnership. Rugby Australia runs the national game; each state and territory has its own union, running club competitions, representative teams and development programmes.',
            'Clubs, most of them run by volunteers, are where nearly everyone plays.',
          ]),
          card(
            pick('volunteers'),
            'Clubs and volunteers',
            'Teams for juniors, seniors, women and veterans.',
            involved,
          ),
          true,
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
          'full-background',
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
        section([
          text(
            'Many teams, one pathway',
            [
              'Australia’s teams range from the Wallabies and Wallaroos to under 20s, sevens squads and four professional clubs.',
              'They are connected by one pathway: players are spotted at school and club level, move through state age-group teams and club academies, and the best go on to wear the gold jersey.',
            ],
            undefined,
            'centered',
          ),
        ]),
        cards('National teams', undefined, 'featured', [
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
            'The women won the first Olympic rugby sevens gold at Rio 2016.',
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
          'full-background',
        ),
        cards(
          'Pathways',
          'The route from club rugby to the national teams.',
          'list',
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
        story(
          'none',
          text('Rugby all year round', [
            'Australian rugby runs on three levels. Test matches bring the national teams together against the best in the world. Super Rugby Pacific and Super W are the professional and elite club competitions.',
            'Underneath them are the state club competitions, played every weekend through autumn and winter.',
          ]),
          card(
            pick('trophy'),
            'Silverware',
            'What Australian teams play for.',
            teams,
          ),
          true,
        ),
        cards('International', undefined, 'overlay', [
          card(
            pick('setPiece'),
            'The Rugby Championship',
            'Australia, New Zealand, South Africa and Argentina, every year.',
            teams,
          ),
          card(
            pick('crowd'),
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
          'full-background',
        ),
        cards(
          'Club rugby',
          'Every state runs its own club competition.',
          'list',
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
          'full-background',
        ),
        story(
          'none',
          text('Off the field', [
            'Team managers, first aiders, canteen helpers and committee members keep every club running. Most clubs need a few more hands each season.',
            'Schools can book coaching visits and programmes that help teachers introduce rugby safely.',
          ]),
          card(
            pick('volunteers'),
            'Volunteer',
            'Every club needs helpers.',
            about,
          ),
          true,
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
            teams,
          ),
        ]),
        callout(
          'Ready to start?',
          ['Clubs in every state and territory are taking new players now.'],
          teams,
        ),
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
        section([
          text(
            'World Cups at home',
            [
              'Australia hosts the men’s Rugby World Cup from 1 October to 13 November 2027, the first time since 2003. The tournament opens in Perth and finishes with the final in Sydney.',
              'In 2029 the Women’s Rugby World Cup comes to Australia for the first time.',
            ],
            undefined,
            'centered',
          ),
        ]),
        statsBand(undefined, [
          stat('1 Oct', 'Rugby World Cup 2027 starts, in Perth'),
          stat('13 Nov', 'The final, in Sydney'),
          stat('2029', 'Women’s Rugby World Cup'),
        ]),
        feature(
          'Rugby World Cup 2027',
          undefined,
          card(
            pick('stadium'),
            'Six weeks of rugby',
            'Matches in cities across the country.',
            teams,
          ),
          card(
            images.perthAerial,
            'Opening match in Perth',
            'The tournament starts in Western Australia.',
            teams,
          ),
        ),
        story(
          'light',
          text(
            'Women’s Rugby World Cup 2029',
            [
              'The first women’s Rugby World Cup in Australia is a chance to grow the game in every state: more teams, more coaches and more girls playing.',
            ],
            involved,
          ),
          card(
            pick('women'),
            'A home World Cup for the Wallaroos',
            'Building towards 2029.',
            involved,
          ),
          true,
          'full-background',
        ),
        cards('Recent events', undefined, 'list', [
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
    ...newsPages(
      slug,
      'Stories, explainers and guides from across Australian rugby.',
      governingBodyStories(pick),
    ),
  ];
}

// -------------------------------------------------------------------- squads

/** "Props" -> "Prop": a player's position from the group the source uses. */
const positionOf: Record<string, string | undefined> = {
  Forwards: 'Forward',
  Backs: 'Back',
  Props: 'Prop',
  Hookers: 'Hooker',
  Locks: 'Lock',
  'Back row': 'Back row',
  'Back rowers': 'Back rower',
  'Loose forwards': 'Loose forward',
  'Scrum-halves': 'Scrum-half',
  Halfbacks: 'Halfback',
  'Half-backs': 'Half-back',
  'Fly-halves': 'Fly-half',
  Flyhalves: 'Flyhalf',
  Centres: 'Centre',
  Midfield: 'Midfield',
  'Outside backs': 'Outside back',
  Utility: 'Utility',
};

/**
 * A team's Squad page: where the list comes from, then one grid of cards
 * per group, grouped as the source groups them. No photos: the cards show
 * initials and a silhouette.
 */
/** Groups too broad to say what a player plays ("Forwards", "Men"). */
const broadGroups = new Set(['Forwards', 'Backs', 'Squad', 'Men', 'Women']);

/** A squad player's card: their official photo, if one was found. */
function squadProfile(siteSlug: string, group: string, player: SquadPlayer) {
  const photo = playerPhoto(siteSlug, player.name);
  // A position from the group, else from the official squad page. Sevens
  // pages give each player's shirt number instead ("#9").
  const official = photo?.position?.startsWith('#')
    ? `No. ${photo.position.slice(1)}`
    : (photo?.position ?? undefined);
  const role = broadGroups.has(group)
    ? (official ?? positionOf[group])
    : positionOf[group];
  // A note ("Captain") joins the position on the small line above the name,
  // so every card's name sits at the same height.
  const label = [role, player.note].filter(Boolean).join(' · ');
  return {
    name: player.name,
    ...(label ? { role: label } : {}),
    ...(photo
      ? {
          cutout: {
            url: `${photo.path}.webp`,
            alt: `${player.name} in the team's official squad photo`,
          },
          background: {
            url: `${photo.path}-bg.webp`,
            alt: `The backdrop of ${player.name}'s squad photo`,
          },
        }
      : {}),
  };
}

/**
 * A few players for a team's home page: taken from each group in turn, so
 * forwards and backs are both there, and only players with a photo.
 */
function meetThePlayers(siteSlug: string, squad: Squad, count = 16) {
  const queues = squad.groups.map((group) =>
    group.players
      .filter((player) => playerPhoto(siteSlug, player.name))
      .map((player) => squadProfile(siteSlug, group.title, player)),
  );
  const picked: ReturnType<typeof squadProfile>[] = [];
  while (picked.length < count && queues.some((queue) => queue.length))
    for (const queue of queues) {
      const next = queue.shift();
      if (next && picked.length < count) picked.push(next);
    }
  return section(
    [
      node('profileGrid', {
        title: '',
        display: 'carousel',
        rows: 'two',
        profiles: picked,
      }),
    ],
    {
      heading: 'Meet the players',
      intro: 'A few of the squad. Everyone is on the Squad page.',
    },
  );
}

const squadPage = (siteSlug: string, squad: Squad): SeedPage =>
  page(siteSlug, '/squad', 'Squad', squad.label, [
    section([
      text(
        'The squad',
        [
          `${squad.label}.`,
          `Named ${formatDate(squad.source.date)}, as listed in “${squad.source.title}”. Photos are the official squad photos.`,
        ],
        link('Read the announcement', squad.source.url),
        'centered',
      ),
    ]),
    ...squad.groups.map((group) =>
      section(
        [
          node('profileGrid', {
            title: '',
            display: 'grid',
            rows: 'one',
            profiles: group.players.map((player) =>
              squadProfile(siteSlug, group.title, player),
            ),
          }),
        ],
        // A list with a single unnamed group needs no heading.
        group.title === 'Squad' ? {} : { heading: group.title },
      ),
    ),
  ]);

// ---------------------------------------------------------- national teams

type NationalTeam = {
  slug: string;
  name: string;
  slides: Slide[];
  story: string[];
  stats: Stat[];
  moments: Card[];
  /** A feature article specific to this team. */
  feature: Story;
  timeline: Card[];
  competitions: Card[];
};

function nationalTeam(team: NationalTeam, pick: Pick): SeedPage[] {
  const history = link('Our history', '/history');
  const matches = link('Matches', '/matches');
  const supporters = link('Supporters', '/supporters');
  return [
    page(team.slug, '/', 'Home', 'News, history and the road ahead.', [
      hero(team.slides),
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
      statsBand(undefined, team.stats),
      ...(squads[team.slug]
        ? [meetThePlayers(team.slug, squads[team.slug])]
        : []),
      cards(
        'Moments',
        'Swipe through some of the milestones.',
        'carousel',
        team.moments,
      ),
      latest('Latest news', 3, 'featured'),
      gallery(
        'Gallery',
        [
          pick('action'),
          pick('setPiece'),
          pick('team'),
          pick('action'),
          pick('crowd'),
          pick('action'),
        ],
        'full-width',
      ),
    ]),
    page(team.slug, '/history', 'History', 'Where the team comes from.', [
      banner(pick('team'), 'Our history', team.story[0]),
      section([text('The story so far', team.story)]),
      cards(
        'Timeline',
        'Swipe through the milestones.',
        'carousel',
        team.timeline,
        'light',
        'full-background',
      ),
      cards('What the jersey means', undefined, 'overlay', [
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
      ]),
    ]),
    page(team.slug, '/matches', 'Matches', 'Competitions and match days.', [
      banner(
        pick('crowd'),
        'Matches',
        'Test rugby at home and around the world.',
      ),
      cards('Competitions', undefined, 'list', team.competitions),
      story(
        'light',
        text(
          'A Test match day',
          [
            'Gates usually open two hours before kick-off. Arrive early to watch the warm-ups, find your seat and be there for the anthems.',
            'Most stadiums are easiest to reach by public transport. Check your ticket before you set out.',
          ],
          supporters,
        ),
        card(
          pick('stadium'),
          'Tickets',
          'Members get first access.',
          supporters,
        ),
        true,
        'full-background',
      ),
    ]),
    page(team.slug, '/supporters', 'Supporters', `Follow the ${team.name}.`, [
      banner(
        pick('crowd'),
        `Support the ${team.name}`,
        'Wear the colours, join as a member and bring the family.',
      ),
      section([
        text(
          'Be part of it',
          [
            'Supporters are the sixth forward at a home Test. Members get priority tickets, member-only events and a say in the season’s awards.',
            'Junior members get a welcome pack and the chance to run out with the team at a home game.',
          ],
          undefined,
          'centered',
        ),
      ]),
      columns(
        'Ways to support',
        'Pick what suits you.',
        'light',
        [
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
        ],
        'full-background',
      ),
      gallery('From the stands', [
        pick('crowd'),
        pick('action'),
        pick('team'),
        pick('setPiece'),
        pick('stadium'),
      ]),
    ]),
    ...newsPages(
      team.slug,
      `News, history and match-day guides from the ${team.name}.`,
      [
        team.feature,
        {
          slug: 'the-story-so-far',
          category: 'History',
          date: dates[1],
          headline: `The ${team.name}: the story so far`,
          standfirst: team.story[0],
          image: pick('team'),
          body: [
            ...team.story.slice(1),
            '## Who plays',
            `Players reach the ${team.name} through club rugby, state teams and the national pathway. Every player who pulls on the jersey gets a cap number, counting every international since the first.`,
          ],
        },
        {
          slug: 'first-test-match',
          category: 'Match day',
          date: dates[2],
          headline: 'A first-timer’s guide to a Test match',
          standfirst:
            'Going to your first international? Here is how to make the most of the day.',
          image: pick('crowd'),
          body: [
            'A Test match is the biggest day on the rugby calendar. Crowds are bigger than at club or Super Rugby games, so a little planning goes a long way.',
            '## Getting there',
            'Public transport is usually the easiest way to reach the stadium. Gates open about two hours before kick-off, and arriving early means you see the warm-ups and are in your seat for the anthems.',
            '## In the stands',
            'Wear the colours and bring a jacket for night games. Kids are welcome, and many stadiums have family areas.',
            '## After the game',
            'Expect queues for transport after the final whistle. Staying for a drink or a bite while the crowd clears often makes for an easier trip home.',
          ],
        },
      ],
    ),
    ...(squads[team.slug] ? [squadPage(team.slug, squads[team.slug])] : []),
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
      stats: [
        stat('1899', 'First Test'),
        stat('2', 'Rugby World Cup titles'),
        stat('1932', 'First Bledisloe Cup'),
        stat('2027', 'A home World Cup'),
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
      feature: {
        slug: 'two-world-cups',
        category: 'History',
        date: dates[0],
        headline: '1991 and 1999: the two World Cup wins',
        standfirst:
          'The Wallabies were the first team to win the Rugby World Cup twice. A look back at both titles.',
        image: pick('trophy'),
        body: [
          'Australia has won the men’s Rugby World Cup twice, in 1991 and 1999. At the time of the second win, no other country had lifted the trophy more than once.',
          '## 1991',
          'The 1991 tournament was played in Britain, Ireland and France. Australia met England in the final at Twickenham and won to become world champions for the first time.',
          '## 1999',
          'Eight years later the final was in Cardiff, where Australia beat France to take the title again.',
          '## Next: a home World Cup',
          'In 2027 the tournament comes to Australia, with the final in Sydney.',
        ],
      },
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
      stats: [
        stat('1994', 'First Test'),
        stat('1998', 'First Rugby World Cup'),
        stat('3rd', 'At the 2010 World Cup'),
        stat('2029', 'A home World Cup'),
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
      feature: {
        slug: 'super-w-and-the-wallaroos',
        category: 'Pathways',
        date: dates[0],
        headline: 'Super W and the road to the Wallaroos',
        standfirst:
          'Since 2018, Super W has given Australia’s best women players a national club competition.',
        image: pick('women'),
        body: [
          'Super W began in 2018. It brings together teams from around the country and gives the best women players regular, high-level games outside the international season.',
          '## Why it matters',
          'Before Super W, the step from club rugby to the Wallaroos was a big one. A national competition lets selectors see players against strong opposition week after week.',
          '## Looking ahead',
          'With the Women’s Rugby World Cup coming to Australia in 2029, the pathway from club and school rugby through Super W to the Wallaroos has never mattered more.',
        ],
      },
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
      stats: [
        stat('7', 'Players a side'),
        stat('7 min', 'Each half'),
        stat('2016', 'Olympic gold for the women'),
        stat('2', 'Teams: men and women'),
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
      feature: {
        slug: 'rio-2016',
        category: 'History',
        date: dates[0],
        headline: 'Rio 2016: the first Olympic gold',
        standfirst:
          'When rugby sevens joined the Olympics, Australia’s women won the first gold medal.',
        image: pick('women'),
        body: [
          'Rugby returned to the Olympic Games at Rio 2016 in its sevens form, with men’s and women’s tournaments.',
          '## The final',
          'Australia’s women reached the final and beat New Zealand to become the first Olympic champions in rugby sevens.',
          '## Why sevens is different',
          'Seven players a side and seven-minute halves make for a fast, open game, with tournaments played over a weekend. Speed and fitness count for as much as size.',
        ],
      },
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
  stats: Stat[];
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
        hero([
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
        ]),
        statsBand(undefined, team.stats),
        ...(squads[team.slug]
          ? [meetThePlayers(team.slug, squads[team.slug])]
          : []),
        story(
          'none',
          text(`Welcome to the ${team.name}`, team.story.slice(0, 2), clubLink),
          card(pick('team'), 'Our honours', 'Titles and milestones.', clubLink),
        ),
        latest('Latest news', 3, 'grid'),
        cards('This season', 'Everything you need for match day.', 'overlay', [
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
        story(
          'light',
          text(
            team.ground,
            [
              `Home games are played at ${team.ground}, with the city of ${team.city} turning out in the club’s colours.`,
            ],
            matchday,
          ),
          card(
            team.cityImages[1],
            team.city,
            `The heart of rugby in ${team.region}.`,
            clubLink,
          ),
          true,
          'full-background',
        ),
        gallery(
          'Gallery',
          [
            pick('action'),
            team.cityImages[0],
            pick('setPiece'),
            pick('action'),
            pick('team'),
          ],
          'full-width',
        ),
      ],
    ),
    page(team.slug, '/club', 'The club', `The story of the ${team.name}.`, [
      banner(team.cityImages[0], `About the ${team.name}`, team.story[0]),
      section([text('Our story', team.story)]),
      cards(
        'Honours and milestones',
        undefined,
        'carousel',
        team.honours.map((honour) =>
          card(pick('team'), honour.year, honour.text, matchday),
        ),
        'brand',
        'full-background',
      ),
      cards(
        'More than one team',
        'The club looks after rugby across its region.',
        'list',
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
      callout(
        'See you at the game',
        [`Memberships for the new season at ${team.ground} are on sale now.`],
        clubLink,
      ),
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
        story(
          'none',
          text('From the local club to Super Rugby', [
            `Every player in the ${team.name} squad started at a local club. Talented juniors are picked for representative age-group teams, and the best join the club’s academy.`,
            'The academy adds coaching, strength and conditioning, and support with school or work, so players are ready when their chance comes.',
          ]),
          card(
            pick('coaching'),
            'The academy',
            'Where the next generation trains.',
            clubLink,
          ),
          true,
        ),
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
              pick('stadium'),
              'Debut',
              `Pulling on the ${team.name} jersey.`,
              backHome,
            ),
          ],
          'light',
          'full-background',
        ),
        cards(
          'Women’s pathway',
          'Girls can follow the same route, all the way to Super W.',
          'overlay',
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
    ...newsPages(
      team.slug,
      `News, stories and match-day guides from the ${team.name}.`,
      [
        {
          slug: 'our-story',
          category: 'History',
          date: dates[0],
          headline: `The ${team.name} story`,
          standfirst: team.story[0],
          image: team.cityImages[0],
          body: [
            ...team.story.slice(1),
            '## Honours',
            team.honours
              .map((honour) => `${honour.year}: ${honour.text}`)
              .join(' '),
          ],
        },
        {
          slug: 'match-day-guide',
          category: 'Match day',
          date: dates[1],
          headline: `Match day at ${team.ground}: what to know`,
          standfirst:
            'Tickets, getting there and what to expect at a home game.',
          image: pick('stadium'),
          body: [
            `Home games at ${team.ground} are a day out for the whole family. Here is how to plan yours.`,
            '## Tickets',
            'Members keep the same seat all season. Single tickets go on sale before each game, and children’s tickets are discounted.',
            '## Getting there',
            `Public transport is the easiest way to ${team.ground} on game day. Allow extra time: the roads around the ground are busy before kick-off.`,
            '## At the ground',
            'Gates open well before kick-off, with activities for kids on the concourse. Stay after the game for signing sessions on selected dates.',
          ],
        },
        {
          slug: 'inside-the-academy',
          category: 'Pathways',
          date: dates[2],
          headline: 'Inside the academy: from club rugby to Super Rugby',
          standfirst: `How young players in ${team.region} find their way into the ${team.name} squad.`,
          image: pick('coaching'),
          body: [
            `Every player in the ${team.name} squad started at a local club. The academy is the bridge between club rugby and the professional game.`,
            '## Who is picked',
            'Talented juniors are spotted in club and school rugby and in representative age-group teams, then invited to train with the academy.',
            '## What the academy adds',
            'Coaching, strength and conditioning, and support with school or work, so players are ready when their chance comes.',
            '## Girls and women',
            'The same pathway leads to the club’s Super W team.',
          ],
        },
      ],
    ),
    ...(squads[team.slug] ? [squadPage(team.slug, squads[team.slug])] : []),
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
      stats: [
        stat('1996', 'First Super Rugby season'),
        stat('2', 'Super Rugby titles'),
        stat('2020', 'Super Rugby AU champions'),
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
      stats: [
        stat('1882', 'First interstate match'),
        stat('2011', 'Super Rugby champions'),
        stat('2021', 'Super Rugby AU champions'),
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
      stats: [
        stat('1882', 'First interstate match'),
        stat('2014', 'Super Rugby champions'),
        stat('Sky blue', 'The state’s colour'),
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
      stats: [
        stat('2006', 'First Super Rugby season'),
        stat('2020', 'Back in Super Rugby'),
        stat('2027', 'World Cup opener in Perth'),
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
      // Community sites keep a rounded slider in the page column.
      hero(
        [
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
        'contained',
      ),
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
        'full-background',
      ),
      latest('Latest news', 3, 'list'),
      cards('Club rugby', undefined, 'featured', [
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
      callout(
        'Registrations are open',
        ['Find a club near you and sign up for the new season.'],
        clubsLink,
      ),
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
          'contained',
        ),
        story(
          'none',
          text('Choosing a club', [
            'The best club is usually the closest one. Most have junior, senior and women’s teams, and all of them welcome beginners.',
            'Call in at a training night before you register: you can meet the coaches, try a session and see which team suits you.',
          ]),
          card(
            pick('coaching'),
            'Your first session',
            'Sports clothes, boots and a mouthguard.',
            involved,
          ),
          true,
        ),
        cards(
          'Where to play',
          'Most clubs have junior, senior and women’s teams.',
          'overlay',
          [
            card(
              body.images[0],
              'Metropolitan clubs',
              'Premier competitions with several grades each weekend.',
              competitions,
            ),
            card(
              pick('ball'),
              'Country clubs',
              'Local competitions and country championships.',
              competitions,
            ),
          ],
          'light',
          'full-background',
        ),
        cards('What to expect', undefined, 'list', [
          card(
            pick('team'),
            'Registration',
            'Register online once you have chosen a club.',
            involved,
          ),
          card(
            pick('juniors'),
            'Training nights',
            'Most teams train once or twice a week, with games on the weekend.',
            competitions,
          ),
        ]),
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
          'contained',
        ),
        section([
          text(
            'There is a role for you',
            [
              'Clubs need more than players. Coaches, referees, team managers, first aiders and canteen helpers all make game day happen.',
              'Courses for coaches and referees run through the year, and most are free for club members.',
            ],
            clubsLink,
            'centered',
          ),
        ]),
        columns(
          'On the field',
          'Courses run through the year.',
          'light',
          getInvolvedCards(pick, clubsLink, clubsLink, competitions),
          'full-background',
        ),
        story(
          'none',
          text('Off the field', [
            'Team managers, first aiders and canteen helpers keep every club running.',
            'Schools can book coaching visits and programmes for primary and secondary students.',
          ]),
          card(
            pick('volunteers'),
            'Volunteer',
            'Every club needs helpers.',
            clubsLink,
          ),
          true,
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
          'contained',
        ),
        story(
          'none',
          text('How the season works', [
            'The club season runs through autumn and winter, with finals at the end. Senior clubs field several grades, so players of every standard get a game.',
            'Junior competitions are organised by age, with rules that change as players grow.',
          ]),
          card(pick('trophy'), 'Finals', 'The end of every season.', clubsLink),
        ),
        cards('Senior rugby', undefined, 'overlay', [
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
        statsBand(
          'Junior rugby by age',
          [
            stat('U6–U9', 'Non-contact games that teach the basics'),
            stat('U10–U12', 'Modified tackle rugby on smaller fields'),
            stat('U13–U18', 'Full rugby with age and weight rules'),
          ],
          'light',
        ),
      ],
    ),
    ...newsPages(
      body.slug,
      `News and guides for players, coaches, referees and volunteers in ${body.state}.`,
      [
        {
          slug: 'choosing-a-club',
          category: 'Community',
          date: dates[0],
          headline: 'How to choose a rugby club',
          standfirst:
            'Close to home, the right teams, a welcoming feel: what to look for.',
          image: pick('team'),
          body: [
            `There are clubs across ${body.state} for every age and level. The right one is usually the closest, but it is worth a look around.`,
            '## Check the teams',
            'Make sure the club has a team for you: juniors by age group, senior grades, women’s fifteens and sevens, or veterans.',
            '## Visit a training night',
            'Most clubs are happy for you to try a session before you register. You can meet the coaches and see how the club feels.',
            '## Register',
            'Once you have chosen, registration is done online, and the club will tell you when and where to turn up.',
          ],
        },
        {
          slug: 'becoming-a-referee',
          category: 'Community',
          date: dates[1],
          headline: 'Thinking about refereeing? Here’s how to start',
          standfirst:
            'Referees are needed every weekend, and you don’t need to have played.',
          image: pick('action'),
          body: [
            'Every game needs a referee, and clubs are always looking for more. Many referees start in their teens, others after their playing days.',
            '## Training',
            'An introductory course covers the laws, positioning and managing a game. New referees usually start with junior matches.',
            '## Support',
            'A mentor watches your first games and helps you improve. As you gain experience you can move up to senior and representative rugby.',
          ],
        },
        {
          slug: 'junior-rugby-explained',
          category: 'Pathways',
          date: dates[2],
          headline: 'Junior rugby explained',
          standfirst: 'Age groups, rules and what changes as players grow.',
          image: pick('juniors'),
          body: [
            'Junior rugby is organised by age, and the rules change as players grow so the game stays safe and fun.',
            '## The youngest players',
            'The youngest age groups play non-contact games that teach passing, running and teamwork.',
            '## Moving to tackle rugby',
            'Tackling is introduced gradually, often on smaller fields with fewer players, before juniors move to the full game.',
            '## Teenagers',
            'Older juniors play full rugby, with age and size rules to keep matches fair. The best are picked for representative teams.',
          ],
        },
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
