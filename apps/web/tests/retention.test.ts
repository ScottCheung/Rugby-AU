import { describe, expect, it } from 'vitest';
import {
  KEEP_LATEST_VERSIONS,
  KEEP_RECENT_DAYS,
  versionsToDelete,
} from '../lib/versions/retention';

const now = new Date('2026-11-21T00:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
/** Versions 1..count, one per day, the newest published `newestAge` days ago. */
const history = (count: number, newestAge: number) =>
  Array.from({ length: count }, (_, index) => ({
    version: index + 1,
    publishedAt: daysAgo(newestAge + (count - 1 - index)),
  }));

describe('version retention', () => {
  it('uses the numbers the README documents', () => {
    expect(KEEP_LATEST_VERSIONS).toBe(10);
    expect(KEEP_RECENT_DAYS).toBe(30);
  });

  it('keeps everything while there are 10 versions or fewer, however old', () => {
    expect(versionsToDelete(history(10, 400), now)).toEqual([]);
  });

  it('deletes old versions beyond the latest 10', () => {
    // 15 versions, all older than 30 days: only the newest 10 stay.
    expect(
      versionsToDelete(history(15, 100), now).sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps every version from the last 30 days, even beyond 10', () => {
    // 25 versions, one a day, the newest today: v1..v25 are 24..0 days old.
    expect(versionsToDelete(history(25, 0), now)).toEqual([]);
  });

  it('applies both rules together', () => {
    // 40 daily versions: v11..v40 are within 30 days (or among the newest
    // 10); v1..v9 are neither. v10 is exactly 30 days old, so it stays.
    const doomed = versionsToDelete(history(40, 0), now);
    expect(doomed.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
