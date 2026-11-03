import type { Donation } from '../types/donationType.ts';

const MINUTE_MS = 60_000;

/** Returns pending donations older than `thresholdMinutes` that have
 *  not already been alerted on. Boundary is inclusive: a donation that
 *  has been pending for exactly `thresholdMinutes` counts as stale,
 *  matching the issue's "remains unverified after 1 hour". */
export function findStalePending(
    now: Date,
    pending: Donation[],
    thresholdMinutes: number = 60
): Donation[] {
    const thresholdMs = thresholdMinutes * MINUTE_MS;
    return pending.filter((d) => {
        if (d.verified) return false;
        if (d.review_alerted_at) return false;
        const age = now.getTime() - new Date(d.created_at).getTime();
        return age >= thresholdMs;
    });
}
