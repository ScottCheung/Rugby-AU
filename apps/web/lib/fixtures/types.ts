/** What the fixtures API returns. Shaped like a typical sports data feed. */

export type Team = {
  id: string;
  name: string;
  /** Three-letter code shown in the badge. */
  short: string;
  /** Badge colours. */
  colour: string;
  text: string;
};

export type FixtureStatus = 'upcoming' | 'live' | 'result';

export type Fixture = {
  id: string;
  competition: string;
  round: string;
  /** ISO 8601, UTC. */
  kickoff: string;
  venue: string;
  city: string;
  home: Team;
  away: Team;
  status: FixtureStatus;
  /** Only once the match is over. */
  score?: { home: number; away: number };
};
