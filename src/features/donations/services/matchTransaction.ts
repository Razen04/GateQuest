import type { Donation } from '../types/donationType.ts';
import type { ParsedTransaction } from './parseBankEmail.ts';

export type MatchResult =
    | { kind: 'autoverify'; donationId: string; actualAmount: number }
    | { kind: 'noop'; reason: 'no_match' | 'already_verified' };

/** Matches on UTR only. UTR is unique on `donations`, so at most one
 *  candidate can match. Amount is taken from the parsed transaction and
 *  written as actual_amount — the donor may have paid a different amount
 *  than they selected; the bank is the source of truth. */
export function matchTransaction(
    txn: ParsedTransaction,
    pending: Donation[]
): MatchResult {
    const match = pending.find((d) => d.utr === txn.utr);
    if (!match) return { kind: 'noop', reason: 'no_match' };
    if (match.verified) return { kind: 'noop', reason: 'already_verified' };
    return {
        kind: 'autoverify',
        donationId: match.id,
        actualAmount: txn.amount,
    };
}
