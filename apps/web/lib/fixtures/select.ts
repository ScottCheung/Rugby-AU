import type { Fixture } from './types';

export type FixtureShow = 'upcoming' | 'results' | 'both';

/**
 * Fixture list: the matches one block shows. Upcoming (and live) matches
 * soonest first, results newest first, each at most `limit`. Pure, so the
 * public page and the editor canvas pick exactly the same matches.
 */
export function selectFixtures(
  fixtures: Fixture[],
  options: { team?: string; show: FixtureShow; limit: number },
): { upcoming: Fixture[]; results: Fixture[] } {
  const own = fixtures.filter(
    (fixture) =>
      !options.team ||
      fixture.home.id === options.team ||
      fixture.away.id === options.team,
  );
  const byKickoff = (a: Fixture, b: Fixture) =>
    a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id);
  const upcoming = own
    .filter((fixture) => fixture.status !== 'result')
    .sort(byKickoff)
    .slice(0, options.limit);
  const results = own
    .filter((fixture) => fixture.status === 'result')
    .sort((a, b) => byKickoff(b, a))
    .slice(0, options.limit);
  return {
    upcoming: options.show === 'results' ? [] : upcoming,
    results: options.show === 'upcoming' ? [] : results,
  };
}

/**
 * "Sun, 8 Nov, 2:10 am AEDT": kick-off in Sydney time, which is what an
 * Australian supporter plans around. The year is added when it is not the
 * current one. A fixed time zone, so server and browser agree.
 */
export function formatKickoff(kickoff: string, now: Date): string {
  const { day, time } = kickoffParts(kickoff, now);
  return `${day}, ${time}`;
}

/** The day and the time of kick-off apart, for layouts that set them differently. */
export function kickoffParts(
  kickoff: string,
  now: Date,
): { day: string; time: string } {
  const date = new Date(kickoff);
  const zone = 'Australia/Sydney';
  const year = (value: Date) =>
    value.toLocaleDateString('en-AU', { year: 'numeric', timeZone: zone });
  const day = date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(year(date) !== year(now) && { year: 'numeric' }),
    timeZone: zone,
  });
  const time = date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: zone,
  });
  return { day, time };
}

/** Won, lost or drawn, from one team's side. Undefined without a score. */
export function outcomeFor(
  fixture: Fixture,
  team: string,
): 'won' | 'lost' | 'drawn' | undefined {
  if (!fixture.score) return undefined;
  const side =
    fixture.home.id === team
      ? 'home'
      : fixture.away.id === team
        ? 'away'
        : undefined;
  if (!side) return undefined;
  const own = fixture.score[side];
  const other = fixture.score[side === 'home' ? 'away' : 'home'];
  return own > other ? 'won' : own < other ? 'lost' : 'drawn';
}
