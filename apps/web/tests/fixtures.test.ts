import { describe, expect, it } from 'vitest';
import { fixtureListSchema } from '../lib/components/fixtureList';
import { fixturesForTree } from '../lib/fixtures/forTree';
import { getFixtures } from '../lib/fixtures/mockApi';
import {
  formatKickoff,
  outcomeFor,
  selectFixtures,
} from '../lib/fixtures/select';
import type { ComponentNode } from '../lib/types';

// The England v Wallabies Test kicks off at 15:10 UTC on 7 November 2026.
const kickoff = new Date('2026-11-07T15:10:00Z');
const minutes = (value: number) => new Date(kickoff.getTime() + value * 60_000);
const englandTest = async (now: Date) =>
  (await getFixtures({ team: 'wallabies', now })).find(
    (fixture) => fixture.id === 'eng-wal-2026',
  )!;

describe('mock fixtures API', () => {
  it('has no score before or during a match, and a score once it is over', async () => {
    expect(await englandTest(minutes(-1))).toMatchObject({
      status: 'upcoming',
    });
    expect((await englandTest(minutes(-1))).score).toBeUndefined();
    expect(await englandTest(minutes(30))).toMatchObject({ status: 'live' });
    expect((await englandTest(minutes(30))).score).toBeUndefined();
    const over = await englandTest(minutes(121));
    expect(over.status).toBe('result');
    expect(over.score).toEqual({
      home: expect.any(Number),
      away: expect.any(Number),
    });
  });

  it('gives a match the same score on every request', async () => {
    const later = new Date('2027-12-31T00:00:00Z');
    expect((await englandTest(later)).score).toEqual(
      (await englandTest(minutes(500))).score,
    );
  });

  it('returns only the matches of the team asked for', async () => {
    const reds = await getFixtures({ team: 'reds', now: kickoff });
    expect(reds.length).toBeGreaterThan(0);
    for (const fixture of reds)
      expect([fixture.home.id, fixture.away.id]).toContain('reds');
  });

  it('names a known team on both sides of every match', async () => {
    for (const fixture of await getFixtures({ now: kickoff })) {
      expect(fixture.home?.name, fixture.id).toBeTruthy();
      expect(fixture.away?.name, fixture.id).toBeTruthy();
    }
  });
});

describe('selectFixtures', () => {
  it('lists upcoming matches soonest first and results newest first', async () => {
    const fixtures = await getFixtures({ now: kickoff });
    const { upcoming, results } = selectFixtures(fixtures, {
      team: 'wallabies',
      show: 'both',
      limit: 3,
    });
    expect(upcoming.map((fixture) => fixture.id)).toEqual([
      'eng-wal-2026',
      'sco-wal-2026',
      'ire-wal-2026',
    ]);
    expect(results.map((fixture) => fixture.id)).toEqual([
      'jpn-wal-2026',
      'wal-nzl-2026',
    ]);
  });

  it('leaves out the kind of match not asked for', async () => {
    const fixtures = await getFixtures({ now: kickoff });
    expect(
      selectFixtures(fixtures, { show: 'upcoming', limit: 5 }).results,
    ).toEqual([]);
    expect(
      selectFixtures(fixtures, { show: 'results', limit: 5 }).upcoming,
    ).toEqual([]);
  });
});

describe('outcomeFor and formatKickoff', () => {
  it('reads the result from the followed team’s side', () => {
    const fixture = {
      home: { id: 'england' },
      away: { id: 'wallabies' },
      score: { home: 19, away: 24 },
    } as Parameters<typeof outcomeFor>[0];
    expect(outcomeFor(fixture, 'wallabies')).toBe('won');
    expect(outcomeFor(fixture, 'england')).toBe('lost');
    expect(outcomeFor(fixture, 'reds')).toBeUndefined();
  });

  it('shows kick-off in Sydney time, with the year only when it differs', () => {
    expect(formatKickoff('2026-11-07T15:10:00Z', kickoff)).toMatch(
      /^Sun, 8 Nov, 2:10\s?am AEDT$/,
    );
    expect(formatKickoff('2027-02-13T08:35:00Z', kickoff)).toMatch(
      /^Sat, 13 Feb 2027, 7:35\s?pm AEDT$/,
    );
  });
});

describe('fixturesForTree', () => {
  const block = (props: Record<string, unknown>): ComponentNode => ({
    id: crypto.randomUUID(),
    type: 'fixtureList',
    props,
  });

  it('asks for nothing when the page has no Fixture list', async () => {
    expect(await fixturesForTree([], kickoff)).toEqual([]);
  });

  it('fetches the teams of Fixture lists nested in Sections, once each', async () => {
    const tree: ComponentNode[] = [
      {
        id: 'section',
        type: 'section',
        props: {},
        children: [
          block({ title: '', team: 'brumbies' }),
          block({ title: '', team: 'reds' }),
        ],
      },
    ];
    const fixtures = await fixturesForTree(tree, kickoff);
    const ids = fixtures.map((fixture) => fixture.id);
    // Brumbies v Reds is in both teams' lists but comes back once.
    expect(ids.filter((id) => id === 'bru-red-2027')).toHaveLength(1);
    for (const fixture of fixtures)
      expect(
        ['brumbies', 'reds'].some((team) =>
          [fixture.home.id, fixture.away.id].includes(team),
        ),
      ).toBe(true);
  });

  it('gives a Fixture list without a team every match', async () => {
    const all = await getFixtures({ now: kickoff });
    expect(await fixturesForTree([block({ title: '' })], kickoff)).toHaveLength(
      all.length,
    );
  });
});

describe('fixtureListSchema', () => {
  it('fills in what to show and how many when they are left out', () => {
    expect(fixtureListSchema.parse({ title: 'Fixtures' })).toEqual({
      title: 'Fixtures',
      show: 'both',
      limit: 4,
    });
  });

  it('only accepts Australian teams that have a site', () => {
    expect(
      fixtureListSchema.safeParse({ title: '', team: 'england' }).success,
    ).toBe(false);
  });
});
