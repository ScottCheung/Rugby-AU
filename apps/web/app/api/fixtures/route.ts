import { getFixtures } from '@/lib/fixtures/mockApi';

/**
 * The mock fixtures API over HTTP: GET /api/fixtures?team=wallabies.
 * The renderer calls `getFixtures` directly (same process, no round trip);
 * this endpoint shows the contract a real provider would offer.
 */
export async function GET(request: Request) {
  const team = new URL(request.url).searchParams.get('team') ?? undefined;
  return Response.json({ fixtures: await getFixtures({ team }) });
}
