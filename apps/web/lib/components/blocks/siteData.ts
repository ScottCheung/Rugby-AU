import type { Entry } from '../../collections';
import type {
  ArticleSummary,
  PlayerSummary,
} from '../../collections/summaries';
import type { Fixture } from '../../fixtures/types';

/**
 * What blocks fed by the site's data read while a page renders (see
 * lib/components/blocks/sources.ts): its articles and players, the path
 * of the page, colours picked from photos and the fixtures service's
 * matches.
 */
export type SiteData = {
  articles: ArticleSummary[];
  /** The site's players. */
  players: PlayerSummary[];
  /** On an entry's own page: the entry the template shows. */
  entry?: Entry;
  pagePath: string;
  /** Card colours taken from photos, keyed by image address (people cards). */
  colors: Record<string, string>;
  /** Matches from the fixtures API. */
  fixtures: Fixture[];
  /** When the page was rendered (ISO): what "upcoming" is measured from. */
  now: string;
};
