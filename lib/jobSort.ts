export interface JobDateLike {
  posted?: string | null;
  posted_at?: string | null;
  fetched_at?: string | null;
}

function validTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getJobPostedTimestamp(
  job: JobDateLike,
  referenceTime = Date.now()
): number {
  const exactPostedAt = validTimestamp(job.posted_at);
  if (exactPostedAt !== null) return exactPostedAt;

  const posted = (job.posted || "").trim();
  const parsedPosted = validTimestamp(posted);
  if (parsedPosted !== null) return parsedPosted;

  const fetchedAt = validTimestamp(job.fetched_at) ?? referenceTime;
  const relative = posted.match(
    /(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i
  );
  if (relative) {
    const amount = Number(relative[1]);
    const unitInMs: Record<string, number> = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return fetchedAt - amount * unitInMs[relative[2].toLowerCase()];
  }

  return fetchedAt;
}

export function sortJobsByNewest<T extends JobDateLike>(
  jobs: readonly T[]
): T[] {
  const referenceTime = Date.now();
  return [...jobs].sort((a, b) => {
    const postedDifference =
      getJobPostedTimestamp(b, referenceTime) -
      getJobPostedTimestamp(a, referenceTime);
    if (postedDifference !== 0) return postedDifference;

    return (
      (validTimestamp(b.fetched_at) ?? 0) -
      (validTimestamp(a.fetched_at) ?? 0)
    );
  });
}
