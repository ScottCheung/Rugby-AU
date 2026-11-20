/**
 * Squads for each team site, copied from the source given with each one.
 * Groups and marks are written as the source gives them; where a source
 * gives no positions (Wallaroos, Sevens) none are added. Nothing here is
 * filled in from memory.
 */

export type SquadPlayer = { name: string; note?: string };
export type SquadGroup = { title: string; players: SquadPlayer[] };
export type Squad = {
  /** What this squad is, e.g. "2027 Super Rugby Pacific squad". */
  label: string;
  source: { title: string; url: string; date: string };
  groups: SquadGroup[];
};

const names = (...list: string[]): SquadPlayer[] =>
  list.map((name) => ({ name }));
const captain = 'Captain';
const uncapped = 'Uncapped';

export const squads: Record<string, Squad> = {
  wallabies: {
    label: 'Squad for the November 2026 Nations Championship Tests',
    // 33 named on 23 October; Hunter Paisami withdrew (personal reasons)
    // and Kurtley Beale, James Ramm and Kalani Thomas were added on 28
    // October. The October page groups players as Forwards and Backs only.
    // Beale ("cover inside centre") and Ramm ("fullback and wing") are
    // described as backs on the second page; Thomas is a scrum-half on his
    // rugby.com.au player page.
    source: {
      title: 'Beale, Ramm & Thomas finalise Wallabies Spring Tour squad',
      url: 'https://www.rugby.com.au/news/beale-ramm-thomas-finalise-wallabies-spring-tour-squad-20261028',
      date: '2026-10-28',
    },
    groups: [
      {
        title: 'Forwards',
        players: [
          ...names(
            'Allan Alaalatoa',
            'Miles Amatosero',
            'Angus Bell',
            'Josh Canham',
            'Massimo De Lutiis',
            'Tom Hooper',
            'Isaac Kailea',
          ),
          { name: 'Tom Lambert', note: uncapped },
          ...names(
            'Fraser McReight',
            'Josh Nasser',
            'Brandon Paenga-Amosa',
            'Billy Pollard',
            'Lukhan Salakaia-Loto',
            'Lachlan Shaw',
            'Carlo Tizzano',
            'Taniela Tupou',
            'Rob Valetini',
            'Jeremy Williams',
          ),
          { name: 'Harry Wilson', note: captain },
        ],
      },
      {
        title: 'Backs',
        players: [
          ...names(
            'Kurtley Beale',
            'Filipo Daugunu',
            'Ben Donaldson',
            'Carter Gordon',
            'Isaac Henry',
            'Len Ikitau',
            'Max Jorgensen',
            'Ryan Lonergan',
            'Tate McDermott',
            'Declan Meredith',
            'Harry Potter',
            'James Ramm',
            'Joseph-Aukuso Suaalii',
            'Kalani Thomas',
          ),
          { name: 'Teddy Wilson', note: uncapped },
          ...names('Tom Wright'),
        ],
      },
    ],
  },

  wallaroos: {
    label: '32-player squad for the 2026 WXV Global Series',
    // The page lists the squad without positions.
    source: {
      title: 'Wallaroos recall stars for WXV Global series',
      url: 'https://www.rugby.com.au/news/wallaroos-recall-stars-for-wxv-global-series-2026827',
      date: '2026-08-27',
    },
    groups: [
      {
        title: 'Squad',
        players: [
          { name: 'Jemma Bemrose', note: uncapped },
          ...names(
            'Lily Bone',
            'Emily Chancellor',
            'Piper Duck',
            'Waiaria Ellis',
          ),
          { name: 'Piper Flynn', note: uncapped },
          ...names(
            'Georgina Friedrichs',
            'Martha Fua',
            'Caitlyn Halse',
            'Tia Hinds',
            'Brianna Hoy',
            'Eva Karpani',
            'Kaitlan Leaney',
            'Michaela Leonard',
            'Hera-Barb Malcolm Heke',
            'Brittany Merlo',
            'Desiree Miller',
            'Tiarah Minns',
            'Faitala Moleka',
            'Tania Naden',
            'Bridie O’Gorman',
            'Siokapesi Palu Sekona',
            'Faliki Pohiva',
            'Ella Ryan',
            'Allana Sikimeti',
            'Piper Simons',
            'Cecilia Smith',
            'Pia Tapsell',
            'Tabua Tuinakauvadra',
            'Ava Wereta',
          ),
          { name: 'Amelia Whitaker', note: uncapped },
          ...names('Samantha Wood'),
        ],
      },
    ],
  },

  'australia-sevens': {
    label:
      'Squads for the Kick On 7s and Sydney quadruple header, October 2026',
    // The most recent squads named; the Dubai squads were not yet announced.
    // No positions are given.
    source: {
      title:
        'Stars named in Australia Sevens squads for Kick On Sevens and Sydney quad header',
      url: 'https://www.rugby.com.au/news/stars-named-in-australia-sevens-squads-for-new-zealand-fiji-clashes-20261013',
      date: '2026-10-14',
    },
    groups: [
      {
        title: 'Men',
        players: [
          ...names(
            'Tylan Berryman',
            'Jayden Blake',
            'Josh Coward',
            'Ben Dalton',
            'Ben Dowling',
            'Deon Evans-Ao Leifi',
          ),
          { name: 'Henry Hutchison', note: captain },
          ...names(
            'Maurice Longbottom',
            'Ethan McFarland',
            'James McGregor',
            'Dane Mitchell',
            'Beau Morrison',
            'Jarvis Orr',
            'Bailey Roberts-Lintmeijer',
            'James Turner',
            'Josh Turner',
            'Harry Wilson',
          ),
        ],
      },
      {
        title: 'Women',
        players: [
          ...names(
            'Bridget Clark',
            'Mackenzie Davis',
            'Heidi Dennis',
            'Kiiahla Duff',
            'Rhani Hagan',
            'Amahli Hala',
            'Kahli Henwood',
            'Alysia Lefau-Fakaosilea',
            'Maddison Levi',
          ),
          { name: 'Isabella Nasser', note: captain },
          ...names(
            'Faith Nathan',
            'Ruby Nicholas',
            'Cobi Ryan-Last',
            'Kaitlin Shave',
            'Bienne Terita',
            'Emmisyn Wynyard',
          ),
        ],
      },
    ],
  },

  brumbies: {
    label: '2027 Super Rugby Pacific squad',
    // The club's own announcement has no list; this is RugbyPass's printed
    // list (36 names, though its text says 35 players).
    source: {
      title:
        '15 Wallabies headline Brumbies squad as club legend closes in on history',
      url: 'https://www.rugbypass.com/news/15-wallabies-headline-brumbies-squad-as-club-legend-closes-in-on-history/',
      date: '2026-10-28',
    },
    groups: [
      {
        title: 'Props',
        players: names(
          'Blake Schoupp',
          'Lington Ieli',
          'James Slipper',
          'Allan Alaalatoa',
          'Rhys van Nek',
          'Tevita Alatini',
          'Darcy Breen',
        ),
      },
      {
        title: 'Hookers',
        players: names('Billy Pollard', 'Lachlan Lonergan', 'Liam Bowron'),
      },
      {
        title: 'Locks',
        players: names(
          'Nick Frost',
          'Toby Macpherson',
          'Aiden Stait',
          'Lachie Shaw',
          'Harvey Cordukes',
        ),
      },
      {
        title: 'Loose forwards',
        players: names(
          'Rob Valetini',
          'Leafi Talataina',
          'Rory Scott',
          'TJ Talaileva',
          'Charlie Cale',
          'Eli Langi',
        ),
      },
      {
        title: 'Scrum-halves',
        players: names('Ryan Lonergan', 'Klayton Thorn', 'Dan Nelson'),
      },
      { title: 'Fly-halves', players: names('Declan Meredith', 'Tane Edmed') },
      {
        title: 'Centres',
        players: names(
          'Len Ikitau',
          'David Feliuai',
          'Kadin Pritchard',
          'Jarrah McLeod',
        ),
      },
      {
        title: 'Outside backs',
        players: names(
          'Tom Wright',
          'Andy Muirhead',
          'Corey Toole',
          'Triston Reilly',
          'Ollie Sapsford',
          'Kye Oates',
        ),
      },
    ],
  },

  reds: {
    label: '2027 Super Rugby Pacific squad',
    source: {
      title: 'Reds Name Squad for 2027 Super Rugby Pacific Campaign',
      url: 'https://www.rugby.com.au/news/reds-name-squad-for-2027-super-rugby-pacific-campaign-20261027',
      date: '2026-10-27',
    },
    groups: [
      {
        title: 'Hookers',
        players: names('Matt Faessler', 'Josh Nasser', 'Zac Hough'),
      },
      {
        title: 'Props',
        players: names(
          'Aidan Ross',
          'George Blake',
          'Tom Lambert',
          'Kingsley Uys',
          'Zane Nonggorr',
          'Massimo De Lutiis',
          'Trevor King',
          'Nick Bloomfield',
        ),
      },
      {
        title: 'Locks',
        players: names(
          'Lukhan Salakaia-Loto',
          'Josh Canham',
          'Will Ross',
          'Cadeyrn Neville',
          'Charlie Brosnan',
        ),
      },
      {
        title: 'Back row',
        players: names(
          'Joe Brial',
          'Vaiuta Latu',
          'Tom Robinson',
          'John Bryant',
          'Fraser McReight',
          'Toby Brial',
          'Lachie Hooper',
          'Harry Wilson',
        ),
      },
      {
        title: 'Halfbacks',
        players: names('Tate McDermott', 'Kalani Thomas', 'James Martens'),
      },
      {
        title: 'Flyhalves',
        players: names('Carter Gordon', 'Tom Lynagh', 'Finn Mackay'),
      },
      {
        title: 'Centres',
        players: names(
          'Isaac Henry',
          'Dre Pakeho',
          'Izaia Perese',
          'Xavier Rubens',
          'Taione Taka',
        ),
      },
      {
        title: 'Outside backs',
        players: names(
          'Lachie Anderson',
          'Tim Ryan',
          'Nicholas Conway',
          'Treyvon Pritchard',
        ),
      },
      { title: 'Utility', players: names('Filipo Daugunu', 'Coby Miln') },
    ],
  },

  waratahs: {
    label: '2027 Super Rugby Pacific squad',
    // The page groups players as Forwards and Backs only.
    source: {
      title: 'Waratahs announce squad for 2027 Swyftx Super Rugby Pacific',
      url: 'https://www.rugby.com.au/news/waratahs-announce-squad-for-2027-swyftx-super-rugby-pacific-20261028',
      date: '2026-10-28',
    },
    groups: [
      {
        title: 'Forwards',
        players: names(
          'Miles Amatosero',
          'Jack Barrett',
          'Angus Bell',
          'Dan Botha',
          'Ethan Dobbins',
          'Eamon Doyle',
          'Folau Faingaa',
          'Isaac Fonua',
          'George Francis',
          'Clem Halaholo',
          'Isaac Kailea',
          'Sefo Kautai',
          'Edwin Langi',
          'Marshall Le Maitre',
          'Matt Philip',
          'Veikoso Poloniati',
          'Apolosi Ranawai',
          'Luke Reimer',
          'Pete Samu',
          'Angus Scott-Young',
        ),
      },
      {
        title: 'Backs',
        players: names(
          'Max Burey',
          'Angus Crichton',
          'Bernard Foley',
          'Joey Fowler',
          'Jake Gordon',
          'Angus Grover',
          'Sid Harvey',
          'James Hendren',
          'Max Jorgensen',
          'Henry O’Donnell',
          'Nick Phipps',
          'George Poolman',
          'Harry Potter',
          'Otto Serfontein',
          'Joseph-Aukuso Suaalii',
          'Teddy Wilson',
        ),
      },
    ],
  },

  'western-force': {
    label: '2027 Super Rugby Pacific squad',
    // The 34-player squad; the page lists ten train-and-trial players
    // separately, outside the 34, so they are not included here.
    source: {
      title: 'Force squad confirmed for 2027 Super Rugby Pacific season',
      url: 'https://www.rugby.com.au/news/force-squad-2027-super-rugby-season-20261028',
      date: '2026-10-28',
    },
    groups: [
      {
        title: 'Props',
        players: names(
          'Misinale Epenisa',
          'Sef Fa’agase',
          'Reuben O’Neill',
          'Marley Pearce',
          'Tom Robertson',
          'Joshua Smith',
        ),
      },
      {
        title: 'Hookers',
        players: names('Nic Dolly', 'Leonel Oviedo', 'Brandon Paenga-Amosa'),
      },
      { title: 'Locks', players: names('Lopeti Faifua', 'Jeremy Williams') },
      {
        title: 'Back rowers',
        players: names(
          'Netani Baleisomosomo',
          'Nick Champion de Crespigny',
          'Jack Daly',
          'Aden Ekanayake',
          'Will Harris',
          'Carlo Tizzano',
        ),
      },
      {
        title: 'Half-backs',
        players: names(
          'Luke Aiken',
          'Nathan Hastie',
          'Agustin Moyano',
          'Henry Robertson',
        ),
      },
      {
        title: 'Fly-halves',
        players: names(
          'Ben Donaldson',
          'Alex Harford',
          'Harry McLaughlin-Phillips',
        ),
      },
      {
        title: 'Midfield',
        players: names('Boston Fakafanua', 'Divad Palu', 'Hamish Stewart'),
      },
      {
        title: 'Outside backs',
        players: names(
          'Wallace Charlie',
          'Mac Grealy',
          'Dylan Pietsch',
          'James Ramm',
        ),
      },
      {
        title: 'Utility',
        players: names('Taj Annan', 'Zac Lomax', 'James O’Connor'),
      },
    ],
  },
};
