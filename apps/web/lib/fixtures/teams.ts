import type { Team } from './types';

/**
 * Sample teams for the mock fixtures API. Badge colours only; names are the
 * teams' public names. No React or database code, so the component schema
 * can import the list of Australian teams from here.
 */

/** The Australian teams that have a site; the Fixture list can follow one. */
export const australianTeams = {
  wallabies: 'Wallabies',
  wallaroos: 'Wallaroos',
  'australia-sevens': 'Australia Sevens',
  brumbies: 'Brumbies',
  reds: 'Reds',
  waratahs: 'Waratahs',
  'western-force': 'Western Force',
} as const;

export type AustralianTeamId = keyof typeof australianTeams;
export const australianTeamIds = Object.keys(australianTeams) as [
  AustralianTeamId,
  ...AustralianTeamId[],
];

const team = (
  id: string,
  name: string,
  short: string,
  colour: string,
  text = '#ffffff',
): Team => ({ id, name, short, colour, text });

const gold = '#f6c300';
const green = '#00523a';

export const teams: Record<string, Team> = Object.fromEntries(
  [
    // Australian teams.
    team('wallabies', 'Wallabies', 'AUS', gold, green),
    team('wallaroos', 'Wallaroos', 'AUS', gold, green),
    team('australia-sevens', 'Australia Sevens', 'AUS', gold, green),
    team('brumbies', 'Brumbies', 'BRU', '#0b2a5b'),
    team('reds', 'Reds', 'RED', '#7a0029'),
    team('waratahs', 'Waratahs', 'WAR', '#58b2e6', '#0a1f44'),
    team('western-force', 'Western Force', 'FOR', '#1d2d5c'),
    // International opponents.
    team('all-blacks', 'All Blacks', 'NZL', '#111111'),
    team('black-ferns', 'Black Ferns', 'NZL', '#111111'),
    team('new-zealand-sevens', 'New Zealand', 'NZL', '#111111'),
    team('england', 'England', 'ENG', '#ececf1', '#c8102e'),
    team('ireland', 'Ireland', 'IRE', '#169b62'),
    team('scotland', 'Scotland', 'SCO', '#0b2f6b'),
    team('wales', 'Wales', 'WAL', '#c8102e'),
    team('japan', 'Japan', 'JPN', '#d7141a'),
    team('fiji', 'Fiji', 'FIJ', '#6cace4', '#0a1f44'),
    team('fiji-sevens', 'Fiji', 'FIJ', '#6cace4', '#0a1f44'),
    team('argentina', 'Argentina', 'ARG', '#75aadb', '#0a1f44'),
    team('argentina-sevens', 'Argentina', 'ARG', '#75aadb', '#0a1f44'),
    team('france-sevens', 'France', 'FRA', '#002395'),
    team('canada', 'Canada', 'CAN', '#d52b1e'),
    team('usa', 'USA', 'USA', '#0a3161'),
    // Super Rugby Pacific opponents.
    team('blues', 'Blues', 'BLU', '#0e4c92'),
    team('chiefs', 'Chiefs', 'CHI', '#c8102e'),
    team('crusaders', 'Crusaders', 'CRU', '#b30838'),
    team('highlanders', 'Highlanders', 'HIG', '#13294b'),
    team('hurricanes', 'Hurricanes', 'HUR', '#ffd100', '#111111'),
    team('moana-pasifika', 'Moana Pasifika', 'MOA', '#008c95'),
    team('fijian-drua', 'Fijian Drua', 'DRU', '#0a2d6e'),
  ].map((entry) => [entry.id, entry]),
);
