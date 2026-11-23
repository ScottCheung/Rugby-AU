import {
  articlesFromEntries,
  playersFromEntries,
} from '../collections/summaries';
import type { Entry } from '../collections';
import type { SourceId } from '../components/blocks/sources';
import { getFixtures } from '../fixtures/mockApi';
import { australianTeamIds } from '../fixtures/teams';
import type { Fixture } from '../fixtures/types';
import { allNodes } from '../components/tree';
import type { SiteData } from '../components/blocks/siteData';
import type { ComponentNode } from '../types';

/** What a source's loader is given while a page renders. */
export type LoadContext = {
  tree: ComponentNode[];
  /** The site's published entries. */
  entries: Entry[];
  now: Date;
  /**
   * The editor: a block can be switched to any option (another team), so
   * it gets everything up front rather than what the page asks for.
   */
  everything: boolean;
};

/**
 * What each data source loads on the server, before a page renders. One
 * per source, typed by SourceId, so a new source cannot be forgotten
 * here. Kept out of lib/components/blocks/sources.ts so that file stays
 * free of server code.
 */
export const sourceLoaders: Record<
  SourceId,
  (context: LoadContext) => Promise<Partial<SiteData>> | Partial<SiteData>
> = {
  news: ({ entries }) => ({ articles: articlesFromEntries(entries) }),
  players: ({ entries }) => ({ players: playersFromEntries(entries) }),
  fixtures: async ({ tree, now, everything }) => ({
    fixtures: everything
      ? await getFixtures({ now })
      : await fixturesForTree(tree, now),
  }),
  // The entry being shown is handed to pageData by the article route.
  entry: () => ({}),
};

/**
 * What a page's blocks of matches need, fetched while the page renders:
 * one API call per team asked for (or one for all teams), none if no
 * block shows matches.
 */
export async function fixturesForTree(
  tree: ComponentNode[],
  now: Date,
): Promise<Fixture[]> {
  const teams = new Set<string | undefined>();
  for (const node of allNodes(tree)) {
    const content = node.props.content as Record<string, unknown> | undefined;
    if (content?.from !== 'fixtures') continue;
    const team = (australianTeamIds as readonly unknown[]).includes(
      content.team,
    )
      ? (content.team as string)
      : undefined;
    teams.add(team);
  }
  if (teams.size === 0) return [];
  const queries = teams.has(undefined) ? [undefined] : [...teams];
  const batches = await Promise.all(
    queries.map((team) => getFixtures({ team, now })),
  );
  // A match between two requested teams comes back twice.
  return [
    ...new Map(batches.flat().map((fixture) => [fixture.id, fixture])).values(),
  ];
}
