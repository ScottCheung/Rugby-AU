import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import {
  formatKickoff,
  outcomeFor,
  selectFixtures,
} from '@/lib/fixtures/select';
import type { Fixture, Team } from '@/lib/fixtures/types';
import type { SiteData } from '@/lib/news';

const outcomeLabels = { won: 'Won', lost: 'Lost', drawn: 'Draw' } as const;

/**
 * Upcoming matches and results from the fixtures API (SiteData), so editors
 * only choose options. No background of its own: borders and secondary
 * text use the current colour, so it reads on any Section background.
 */
export function FixtureList({
  title,
  team,
  show,
  limit,
  data,
}: PropsOf<'fixtureList'> & { data: SiteData }) {
  const now = new Date(data.now);
  const { upcoming, results } = selectFixtures(data.fixtures, {
    team,
    show,
    limit,
  });
  const groups = [
    ...(show === 'results'
      ? []
      : [
          {
            label: 'Upcoming',
            items: upcoming,
            empty: 'No matches coming up.',
          },
        ]),
    ...(show === 'upcoming'
      ? []
      : [{ label: 'Results', items: results, empty: 'No results yet.' }]),
  ];

  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      <div
        className={`grid gap-site-md ${groups.length > 1 ? '@2xl:grid-cols-2' : ''}`}
      >
        {groups.map((group) => (
          <section
            key={group.label}
            aria-label={group.label}
            className="flex min-w-0 flex-col gap-2"
          >
            {groups.length > 1 && (
              <h3 className="m-0 text-xs font-semibold tracking-wide uppercase opacity-70">
                {group.label}
              </h3>
            )}
            {group.items.length > 0 ? (
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {group.items.map((fixture) => (
                  <FixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    team={team}
                    now={now}
                  />
                ))}
              </ol>
            ) : (
              <p className="m-0 rounded-site border border-dashed border-current/25 p-site-sm text-sm opacity-75">
                {group.empty}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function FixtureRow({
  fixture,
  team,
  now,
}: {
  fixture: Fixture;
  team?: string;
  now: Date;
}) {
  const { score } = fixture;
  const outcome = team ? outcomeFor(fixture, team) : undefined;
  const lost = (side: 'home' | 'away') =>
    !!score && score[side] < score[side === 'home' ? 'away' : 'home'];

  return (
    <li className="flex flex-col gap-3 rounded-site border border-current/15 p-site-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold tracking-wide uppercase opacity-70">
          {fixture.competition} · {fixture.round}
        </span>
        <span className="flex items-center gap-2">
          {fixture.status === 'live' && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span aria-hidden className="size-2 rounded-full bg-red-500" />
              Live
            </span>
          )}
          {outcome && (
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${outcome === 'won' ? 'bg-current/15' : 'border border-current/30'}`}
            >
              {outcomeLabels[outcome]}
            </span>
          )}
          <time dateTime={fixture.kickoff} className="opacity-70">
            {formatKickoff(fixture.kickoff, now)}
          </time>
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <TeamSide team={fixture.home} muted={lost('home')} />
        <div className="site-heading text-2xl leading-none font-bold whitespace-nowrap tabular-nums">
          {score ? (
            <>
              {score.home}
              <span aria-label="to" className="px-1 opacity-50">
                –
              </span>
              {score.away}
            </>
          ) : (
            <span className="text-base opacity-60">v</span>
          )}
        </div>
        <TeamSide team={fixture.away} muted={lost('away')} reverse />
      </div>

      <p className="m-0 text-xs opacity-70">
        {fixture.venue}, {fixture.city}
      </p>
    </li>
  );
}

/** A team's colour badge and name; the away side mirrors the home side. */
function TeamSide({
  team,
  muted,
  reverse = false,
}: {
  team: Team;
  muted: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${reverse ? 'flex-row-reverse text-right' : ''} ${muted ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full text-[0.65rem] font-black tracking-wide shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ background: team.colour, color: team.text }}
      >
        {team.short}
      </span>
      <span className="min-w-0 truncate text-sm font-semibold @md:text-base">
        {team.name}
      </span>
    </div>
  );
}
