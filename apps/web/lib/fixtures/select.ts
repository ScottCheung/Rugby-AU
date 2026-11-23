import type { Fixture } from './types';

export type FixtureShow = 'upcoming' | 'results' | 'both';

/**
 * The matches one block shows: upcoming (and live) matches soonest first,
 * results newest first, each at most `limit`. Hidden ones are kept and
 * marked (the editor shows them ghosted; visitors never get them). Hidden matches do not count towards the limit, so
 * hiding one lets the next take its place.
 */
export function selectFixturesMarked(
  fixtures: Fixture[],
  options: {
    team?: string;
    show: FixtureShow;
    limit: number;
    hidden?: string[];
  },
): {
  upcoming: { fixture: Fixture; hidden: boolean }[];
  results: { fixture: Fixture; hidden: boolean }[];
} {
  const hidden = new Set(options.hidden);
  const take = (list: Fixture[]) => {
    let visible = 0;
    const out: { fixture: Fixture; hidden: boolean }[] = [];
    for (const fixture of list) {
      const isHidden = hidden.has(fixture.id);
      if (!isHidden && visible >= options.limit) continue;
      if (!isHidden) visible += 1;
      out.push({ fixture, hidden: isHidden });
    }
    return out;
  };
  const own = fixtures.filter(
    (fixture) =>
      !options.team ||
      fixture.home.id === options.team ||
      fixture.away.id === options.team,
  );
  const byKickoff = (a: Fixture, b: Fixture) =>
    a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id);
  const upcoming = take(
    own.filter((fixture) => fixture.status !== 'result').sort(byKickoff),
  );
  const results = take(
    own
      .filter((fixture) => fixture.status === 'result')
      .sort((a, b) => byKickoff(b, a)),
  );
  return {
    upcoming: options.show === 'results' ? [] : upcoming,
    results: options.show === 'upcoming' ? [] : results,
  };
}

/**
 * Kick-off in Sydney time ("Sun, 8 Nov" and "2:10 am AEDT"), which is what
 * an Australian supporter plans around. The year is added when it is not
 * the current one. A fixed time zone, so server and browser agree.
 */
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
