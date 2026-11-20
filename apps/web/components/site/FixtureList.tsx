import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { CircleCheck, Clock, MapPin, Radio } from 'lucide-react';
import {
  kickoffParts,
  outcomeFor,
  selectFixtures,
} from '@/lib/fixtures/select';
import type { Fixture, Team } from '@/lib/fixtures/types';
import type { SiteData } from '@/lib/news';

const outcomeLabels = { won: 'Won', lost: 'Lost', drawn: 'Draw' } as const;

/**
 * Upcoming matches and results from the fixtures API (SiteData), so editors
 * only choose options. Each match is a card on the page's own background,
 * like a Card Grid card, so it reads on any Section background.
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
  const { score, status } = fixture;
  const outcome = team ? outcomeFor(fixture, team) : undefined;
  // Solid unless beaten, so a draw keeps both scores solid.
  const won = (side: 'home' | 'away') =>
    !!score && score[side] >= score[side === 'home' ? 'away' : 'home'];
  const { day, time } = kickoffParts(fixture.kickoff, now);

  return (
    <li className="group flex flex-col fixture-card rounded-site border border-transparent p-site-sm text-text shadow-sm transition duration-300 hover:border-brand/40 motion-safe:hover:-translate-y-1">
      {/* Status on the left, competition and round on the right. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <StatusPill status={status} outcome={outcome} />
        <span className="truncate rounded-md bg-text/5 px-2 py-1 text-[0.65rem] font-bold text-muted-text">
          {fixture.competition} · {fixture.round}
        </span>
      </div>

      {/* Home and away mirror each other around "VS"; the winner's score is
          solid, the other side's fades back. */}
      <div className="flex items-center justify-between gap-3">
        <TeamSide
          team={fixture.home}
          score={score?.home}
          winner={won('home')}
          played={!!score}
        />
        <span
          aria-hidden={!!score}
          className="shrink-0 text-[0.65rem] font-black tracking-widest italic opacity-30"
        >
          VS
        </span>
        <TeamSide
          team={fixture.away}
          score={score?.away}
          winner={won('away')}
          played={!!score}
          reverse
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-text/10 pt-4 text-[0.7rem] font-bold text-muted-text">
        <span className="flex items-center gap-2">
          <Clock aria-hidden className="size-3 opacity-70" />
          <time dateTime={fixture.kickoff}>
            {day} · <span className="opacity-60">{time}</span>
          </time>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <MapPin aria-hidden className="size-3 shrink-0 opacity-70" />
          <span className="truncate">
            {fixture.venue}, {fixture.city}
          </span>
        </span>
      </div>
    </li>
  );
}

/** Full time (or Won / Lost / Draw for the followed team), Live or Upcoming. */
function StatusPill({
  status,
  outcome,
}: {
  status: Fixture['status'];
  outcome?: keyof typeof outcomeLabels;
}) {
  const pill =
    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-wider uppercase';
  if (status === 'result')
    return (
      <span
        className={`${pill} pill-tone bg-sky-500/15 [--tone:var(--color-sky-600)]`}
      >
        <CircleCheck aria-hidden className="size-3 stroke-[2.5px]" />
        {outcome ? outcomeLabels[outcome] : 'Full time'}
      </span>
    );
  if (status === 'live')
    return (
      <span
        className={`${pill} pill-tone bg-red-500/15 [--tone:var(--color-red-600)]`}
      >
        <Radio aria-hidden className="size-3 stroke-[2.5px]" />
        Live
      </span>
    );
  return (
    <span
      className={`${pill} pill-tone bg-amber-500/15 [--tone:var(--color-amber-600)]`}
    >
      <Clock aria-hidden className="size-3 stroke-[2.5px]" />
      Upcoming
    </span>
  );
}

/**
 * A team's colour badge with its name under it, and the score beside it
 * once the match is over. The away side mirrors the home side.
 */
function TeamSide({
  team,
  score,
  winner,
  played,
  reverse = false,
}: {
  team: Team;
  score?: number;
  winner: boolean;
  played: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${reverse ? 'flex-row-reverse text-right' : ''}`}
    >
      <div className="flex min-w-0 flex-col items-center gap-2">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full text-xs font-black tracking-wide shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
          style={{ background: team.colour, color: team.text }}
        >
          {team.short}
        </span>
        <span className="max-w-24 truncate text-[0.7rem] font-bold tracking-tight opacity-60">
          {team.name}
        </span>
      </div>
      {played && score !== undefined && (
        <span
          className={`site-heading text-4xl leading-none font-black tabular-nums transition-opacity ${winner ? '' : 'opacity-30 group-hover:opacity-60'}`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
