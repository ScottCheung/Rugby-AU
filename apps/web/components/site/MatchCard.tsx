import type { CSSProperties } from 'react';
import { NotchCard } from '@/components/primitives/NotchCard';
import { CircleCheck, Clock, MapPin, Radio } from 'lucide-react';
import { kickoffParts, outcomeFor } from '@/lib/fixtures/select';
import type { Fixture, Team } from '@/lib/fixtures/types';

const outcomeLabels = { won: 'Won', lost: 'Lost', drawn: 'Draw' } as const;

/** One match. Lays out nothing around itself: its block does. */
export function MatchCard({
  fixture,
  team,
  now,
  showVenue = true,
  className = '',
}: MatchProps) {
  const { score, status } = fixture;
  const outcome = team ? outcomeFor(fixture, team) : undefined;
  // Solid unless beaten, so a draw keeps both scores solid.
  const won = (side: 'home' | 'away') =>
    !!score && score[side] >= score[side === 'home' ? 'away' : 'home'];
  const { day, time } = kickoffParts(fixture.kickoff, now);

  return (
    // Tab (top left): the competition and round. Top right: the status.
    // Body: who played, the score, when and where.
    <NotchCard
      className={`group ${className}`}
      title={`${fixture.competition} · ${fixture.round}`}
      aside={<StatusLabel status={status} outcome={outcome} />}
      asideTone={statusTone[status]}
    >
      {/* The two sides and the score, together in the middle. Names are in
          the badges' labels; the winner's score is solid, the other fades. */}
      <div className="flex items-center justify-center gap-site-sm py-site-xs">
        <TeamBadge team={fixture.home} />
        {score ? (
          <>
            <Score value={score.home} winner={won('home')} />
            <span aria-hidden className="text-sm font-bold opacity-40">
              –
            </span>
            <Score value={score.away} winner={won('away')} />
          </>
        ) : (
          <span className="text-xs font-black tracking-widest italic opacity-50">
            VS
          </span>
        )}
        <TeamBadge team={fixture.away} />
      </div>

      <div className="mt-site-sm flex flex-col gap-site-xs border-t border-text/10 pt-site-sm text-[0.7rem] font-bold text-muted-text">
        <span className="flex items-center gap-2">
          <Clock aria-hidden className="size-3 opacity-70" />
          <time dateTime={fixture.kickoff}>
            {day} · <span className="font-semibold">{time}</span>
          </time>
        </span>
        {showVenue && (
          <span className="flex min-w-0 items-center gap-2">
            <MapPin aria-hidden className="size-3 shrink-0 opacity-70" />
            <span className="truncate">
              {fixture.venue}, {fixture.city}
            </span>
          </span>
        )}
      </div>
    </NotchCard>
  );
}

type MatchProps = {
  fixture: Fixture;
  team?: string;
  now: Date;
  showVenue?: boolean;
  className?: string;
};

/** The colour of a match's status: sky when played, red live, amber to come. */
const statusTone = {
  result: 'var(--color-sky-600)',
  live: 'var(--color-red-600)',
  upcoming: 'var(--color-amber-600)',
} as const;

/**
 * Full time (or Won / Lost / Draw for the followed team), Live or Upcoming,
 * as plain text with an icon: the card's corner is tinted with the status
 * colour (NotchCard `asideTone`), so no pill of its own is needed.
 */
function StatusLabel({
  status,
  outcome,
}: {
  status: Fixture['status'];
  outcome?: keyof typeof outcomeLabels;
}) {
  const Icon =
    status === 'result' ? CircleCheck : status === 'live' ? Radio : Clock;
  const text =
    status === 'result'
      ? outcome
        ? outcomeLabels[outcome]
        : 'Full time'
      : status === 'live'
        ? 'Live'
        : 'Upcoming';
  return (
    <span
      style={{ '--tone': statusTone[status] } as CSSProperties}
      className="pill-tone inline-flex items-center gap-1.5 text-[0.7rem] font-bold tracking-wider whitespace-nowrap uppercase"
    >
      <Icon aria-hidden className="size-3.5 stroke-[2.5px]" />
      {text}
    </span>
  );
}

/** A team's colour badge. Its name is read out and shown on hover. */
function TeamBadge({ team }: { team: Team }) {
  return (
    <span
      title={team.name}
      className="relative grid size-11 shrink-0 place-items-center rounded-full text-xs font-black tracking-wide shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
      style={{ background: team.colour, color: team.text }}
    >
      <span aria-hidden>{team.short}</span>
      <span className="sr-only">{team.name}</span>
    </span>
  );
}

function Score({ value, winner }: { value: number; winner: boolean }) {
  return (
    <span
      className={`site-heading text-3xl leading-none font-black tabular-nums transition-opacity ${winner ? '' : 'opacity-45 group-hover:opacity-70'}`}
    >
      {value}
    </span>
  );
}
