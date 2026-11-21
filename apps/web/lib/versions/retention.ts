/**
 * Which published versions of a page to keep. A version is kept if it is
 * one of the latest KEEP_LATEST_VERSIONS, or if it was published within
 * the last KEEP_RECENT_DAYS days. Everything else is deleted on publish.
 *
 * Why both: the count guarantees a quiet page still has some history to
 * roll back to, however old; the time window guarantees that a busy day of
 * twenty publishes does not push out last week's version.
 */
export const KEEP_LATEST_VERSIONS = 10;
export const KEEP_RECENT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The version numbers to delete. Pure, so it is easy to test. */
export function versionsToDelete(
  versions: { version: number; publishedAt: Date }[],
  now: Date,
): number[] {
  const newestFirst = [...versions].sort((a, b) => b.version - a.version);
  const cutoff = now.getTime() - KEEP_RECENT_DAYS * DAY_MS;
  return newestFirst
    .filter(
      (entry, index) =>
        index >= KEEP_LATEST_VERSIONS && entry.publishedAt.getTime() < cutoff,
    )
    .map((entry) => entry.version);
}
