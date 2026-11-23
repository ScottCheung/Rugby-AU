import { MatchCard } from '../MatchCard';
import type { ItemProps } from './types';

/** A match card; won or lost is told from the team the match is seen from. */
export function MatchItem({ item, style, now }: ItemProps<'matches'>) {
  if (!item.match) return null;
  return (
    <MatchCard
      fixture={item.match.fixture}
      team={item.match.team}
      now={new Date(now)}
      showVenue={style.showVenue}
      className="h-full"
    />
  );
}
