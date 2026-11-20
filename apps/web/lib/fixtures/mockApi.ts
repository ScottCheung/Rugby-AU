import { teams } from './teams';
import type { Fixture, FixtureStatus } from './types';

/**
 * A mock fixtures API, standing in for a sports data provider. Sample data
 * only: the schedule is invented for this demo, and so are the scores.
 *
 * It behaves like a live feed: the status of a match and its score depend
 * on the time of the request. A match has no score until it is over, so the
 * same page shows "upcoming" one week and a result the next.
 *
 * Swapping in a real provider means replacing `getFixtures` with an HTTP
 * call that returns the same `Fixture` shape; nothing else changes.
 */

type Kind = 'fifteens' | 'sevens';
type ScheduledMatch = {
  id: string;
  kind: Kind;
  competition: string;
  round: string;
  kickoff: string;
  venue: string;
  city: string;
  home: string;
  away: string;
};

const test = (
  id: string,
  round: string,
  kickoff: string,
  venue: string,
  city: string,
  home: string,
  away: string,
): ScheduledMatch => ({
  id,
  kind: 'fifteens',
  competition: 'Test match',
  round,
  kickoff,
  venue,
  city,
  home,
  away,
});

const sevens = (
  id: string,
  round: string,
  kickoff: string,
  venue: string,
  city: string,
  away: string,
): ScheduledMatch => ({
  id,
  kind: 'sevens',
  competition: 'Sevens Series',
  round,
  kickoff,
  venue,
  city,
  home: 'australia-sevens',
  away,
});

const superRugby = (
  id: string,
  round: string,
  kickoff: string,
  venue: string,
  city: string,
  home: string,
  away: string,
): ScheduledMatch => ({
  id,
  kind: 'fifteens',
  competition: 'Super Rugby Pacific',
  round,
  kickoff,
  venue,
  city,
  home,
  away,
});

/** Kick-off times are UTC. One match per line, so the table stays readable. */
// prettier-ignore
const schedule: ScheduledMatch[] = [
  // Wallabies
  test('wal-nzl-2026', 'Bledisloe Cup', '2026-10-10T06:05:00Z', 'Eden Park', 'Auckland', 'all-blacks', 'wallabies'),
  test('jpn-wal-2026', 'Spring Tour', '2026-10-31T05:50:00Z', 'Japan National Stadium', 'Tokyo', 'japan', 'wallabies'),
  test('eng-wal-2026', 'Spring Tour', '2026-11-07T15:10:00Z', 'Allianz Stadium, Twickenham', 'London', 'england', 'wallabies'),
  test('sco-wal-2026', 'Spring Tour', '2026-11-14T15:10:00Z', 'Murrayfield', 'Edinburgh', 'scotland', 'wallabies'),
  test('ire-wal-2026', 'Spring Tour', '2026-11-21T17:40:00Z', 'Aviva Stadium', 'Dublin', 'ireland', 'wallabies'),
  test('wls-wal-2026', 'Spring Tour', '2026-11-28T15:10:00Z', 'Principality Stadium', 'Cardiff', 'wales', 'wallabies'),
  test('wal-fij-2027', 'Home Test', '2027-07-03T12:00:00Z', 'Optus Stadium', 'Perth', 'wallabies', 'fiji'),
  test('wal-arg-2027', 'Home Test', '2027-07-10T09:45:00Z', 'Suncorp Stadium', 'Brisbane', 'wallabies', 'argentina'),
  // Wallaroos
  test('wro-can-2026', 'Home Test', '2026-10-11T04:05:00Z', 'Ballymore', 'Brisbane', 'wallaroos', 'canada'),
  test('wro-usa-2026', 'Home Test', '2026-10-25T02:00:00Z', 'Allianz Stadium', 'Sydney', 'wallaroos', 'usa'),
  test('bfe-wro-2026', 'Laurie O’Reilly Cup', '2026-11-29T02:05:00Z', 'Apollo Projects Stadium', 'Christchurch', 'black-ferns', 'wallaroos'),
  test('can-wro-2027', 'Pacific Four Series', '2027-04-24T19:00:00Z', 'Starlight Stadium', 'Langford', 'canada', 'wallaroos'),
  test('usa-wro-2027', 'Pacific Four Series', '2027-05-02T22:00:00Z', 'Snapdragon Stadium', 'San Diego', 'usa', 'wallaroos'),
  // Australia Sevens
  sevens('aus7-nzl-2026', 'Oceania Sevens', '2026-11-07T03:30:00Z', 'Ballymore', 'Brisbane', 'new-zealand-sevens'),
  sevens('aus7-fij-2026', 'Oceania Sevens', '2026-11-08T05:00:00Z', 'Ballymore', 'Brisbane', 'fiji-sevens'),
  sevens('aus7-arg-dxb', 'Dubai', '2026-12-05T06:00:00Z', 'The Sevens Stadium', 'Dubai', 'argentina-sevens'),
  sevens('aus7-fra-dxb', 'Dubai', '2026-12-05T10:00:00Z', 'The Sevens Stadium', 'Dubai', 'france-sevens'),
  sevens('aus7-nzl-cpt', 'Cape Town', '2026-12-12T09:30:00Z', 'DHL Stadium', 'Cape Town', 'new-zealand-sevens'),
  sevens('aus7-fij-per', 'Perth', '2027-01-23T08:00:00Z', 'HBF Park', 'Perth', 'fiji-sevens'),
  // Super Rugby Pacific: the end of the 2026 season
  superRugby('bru-hig-2026', 'Round 15', '2026-05-23T09:35:00Z', 'GIO Stadium', 'Canberra', 'brumbies', 'highlanders'),
  superRugby('red-blu-2026', 'Round 15', '2026-05-23T09:35:00Z', 'Suncorp Stadium', 'Brisbane', 'reds', 'blues'),
  superRugby('war-chi-2026', 'Round 15', '2026-05-22T09:35:00Z', 'Allianz Stadium', 'Sydney', 'waratahs', 'chiefs'),
  superRugby('moa-for-2026', 'Round 15', '2026-05-23T02:35:00Z', 'North Harbour Stadium', 'Auckland', 'moana-pasifika', 'western-force'),
  superRugby('hur-bru-2026', 'Round 16', '2026-05-30T07:05:00Z', 'Sky Stadium', 'Wellington', 'hurricanes', 'brumbies'),
  superRugby('dru-red-2026', 'Round 16', '2026-05-30T03:05:00Z', 'Churchill Park', 'Lautoka', 'fijian-drua', 'reds'),
  superRugby('war-for-2026', 'Round 16', '2026-05-30T09:35:00Z', 'Allianz Stadium', 'Sydney', 'waratahs', 'western-force'),
  superRugby('chi-bru-2026', 'Qualifying final', '2026-06-06T07:05:00Z', 'FMG Stadium Waikato', 'Hamilton', 'chiefs', 'brumbies'),
  // Super Rugby Pacific: the start of the 2027 season
  superRugby('bru-red-2027', 'Round 1', '2027-02-13T08:35:00Z', 'GIO Stadium', 'Canberra', 'brumbies', 'reds'),
  superRugby('for-dru-2027', 'Round 1', '2027-02-13T11:35:00Z', 'HBF Park', 'Perth', 'western-force', 'fijian-drua'),
  superRugby('war-hur-2027', 'Round 1', '2027-02-14T06:00:00Z', 'Allianz Stadium', 'Sydney', 'waratahs', 'hurricanes'),
  superRugby('cru-bru-2027', 'Round 2', '2027-02-20T06:05:00Z', 'Apollo Projects Stadium', 'Christchurch', 'crusaders', 'brumbies'),
  superRugby('red-war-2027', 'Round 2', '2027-02-20T09:35:00Z', 'Suncorp Stadium', 'Brisbane', 'reds', 'waratahs'),
  superRugby('hig-for-2027', 'Round 2', '2027-02-21T04:05:00Z', 'Forsyth Barr Stadium', 'Dunedin', 'highlanders', 'western-force'),
  superRugby('bru-moa-2027', 'Round 3', '2027-02-27T08:35:00Z', 'GIO Stadium', 'Canberra', 'brumbies', 'moana-pasifika'),
  superRugby('chi-red-2027', 'Round 3', '2027-02-27T06:05:00Z', 'FMG Stadium Waikato', 'Hamilton', 'chiefs', 'reds'),
  superRugby('for-hur-2027', 'Round 3', '2027-02-27T11:35:00Z', 'HBF Park', 'Perth', 'western-force', 'hurricanes'),
  superRugby('blu-war-2027', 'Round 3', '2027-02-28T06:05:00Z', 'Eden Park', 'Auckland', 'blues', 'waratahs'),
  superRugby('war-bru-2027', 'Round 4', '2027-03-06T08:35:00Z', 'Allianz Stadium', 'Sydney', 'waratahs', 'brumbies'),
  superRugby('red-for-2027', 'Round 4', '2027-03-06T09:35:00Z', 'Suncorp Stadium', 'Brisbane', 'reds', 'western-force'),
];

/** How long after kick-off a match is over. */
const matchLength: Record<Kind, number> = {
  fifteens: 2 * 60 * 60 * 1000,
  sevens: 30 * 60 * 1000,
};

/** FNV-1a: a small stable hash, so a match always gets the same score. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** A believable score made of tries, conversions and (in XVs) penalties. */
function points(seed: string, kind: Kind): number {
  const h = hash(seed);
  const tries = h % (kind === 'sevens' ? 7 : 6);
  const conversions = (h >>> 4) % (tries + 1);
  // At least one penalty in XVs: a Test team is rarely held scoreless.
  const penalties = kind === 'sevens' ? 0 : 1 + ((h >>> 8) % 4);
  return tries * 5 + conversions * 2 + penalties * 3;
}

function statusAt(match: ScheduledMatch, now: Date): FixtureStatus {
  const start = Date.parse(match.kickoff);
  if (now.getTime() < start) return 'upcoming';
  if (now.getTime() < start + matchLength[match.kind]) return 'live';
  return 'result';
}

function toFixture(match: ScheduledMatch, now: Date): Fixture {
  const status = statusAt(match, now);
  return {
    id: match.id,
    competition: match.competition,
    round: match.round,
    kickoff: match.kickoff,
    venue: match.venue,
    city: match.city,
    home: teams[match.home],
    away: teams[match.away],
    status,
    ...(status === 'result' && {
      score: {
        home: points(`${match.id}:home`, match.kind),
        away: points(`${match.id}:away`, match.kind),
      },
    }),
  };
}

/**
 * The API: every fixture, or one team's, as they stand at `now`. Async
 * like the network call it stands in for.
 */
export async function getFixtures({
  team,
  now = new Date(),
}: {
  team?: string;
  now?: Date;
} = {}): Promise<Fixture[]> {
  return schedule
    .filter((match) => !team || match.home === team || match.away === team)
    .map((match) => toFixture(match, now));
}
