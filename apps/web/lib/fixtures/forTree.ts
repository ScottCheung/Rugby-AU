import { fixtureListSchema } from '../components/fixtureList';
import type { ComponentNode } from '../types';
import { getFixtures } from './mockApi';
import type { Fixture } from './types';

function fixtureLists(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.flatMap((node) => [
    ...(node.type === 'fixtureList' ? [node] : []),
    ...fixtureLists(node.children ?? []),
  ]);
}

/**
 * What a page's Fixture lists need, fetched while the page renders: one
 * API call per team asked for (or one for all teams), none if the page has
 * no Fixture list.
 */
export async function fixturesForTree(
  tree: ComponentNode[],
  now: Date,
): Promise<Fixture[]> {
  const teams = new Set<string | undefined>();
  for (const node of fixtureLists(tree)) {
    const parsed = fixtureListSchema.safeParse(node.props);
    if (parsed.success) teams.add(parsed.data.team);
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
