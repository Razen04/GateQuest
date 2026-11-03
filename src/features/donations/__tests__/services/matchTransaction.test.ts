import { describe, expect, it } from 'vitest';
import { matchTransaction } from '../../services/matchTransaction.ts';
import type { Donation } from '../../types/donationType.ts';

const baseDonation = (overrides: Partial<Donation> = {}): Donation => ({
    id: 'd-1',
    user_id: null,
    anonymous: false,
    message: null,
    suggested_amount: 500,
    actual_amount: 500,
    utr: '123456789012',
    verified: false,
    created_at: '2026-11-03T10:00:00Z',
    verified_at: null,
    verification_method: null,
    review_alerted_at: null,
    ...overrides,
});

describe('matchTransaction', () => {
    it('returns autoverify with the parsed amount when UTR matches', () => {
        const donation = baseDonation({ id: 'd-1' });
        const result = matchTransaction({ utr: '123456789012', amount: 500 }, [
            donation,
        ]);
        expect(result).toEqual({
            kind: 'autoverify',
            donationId: 'd-1',
            actualAmount: 500,
        });
    });

    it('uses the parsed amount even if it differs from suggested_amount', () => {
        // Donor selected 500 but paid 450 — we still autoverify with 450.
        const donation = baseDonation({
            id: 'd-2',
            suggested_amount: 500,
            actual_amount: 500,
        });
        const result = matchTransaction({ utr: '123456789012', amount: 450 }, [
            donation,
        ]);
        expect(result).toEqual({
            kind: 'autoverify',
            donationId: 'd-2',
            actualAmount: 450,
        });
    });

    it('returns noop/no_match when no donation carries the UTR', () => {
        const donation = baseDonation({ utr: '999999999999' });
        const result = matchTransaction({ utr: '123456789012', amount: 500 }, [
            donation,
        ]);
        expect(result).toEqual({ kind: 'noop', reason: 'no_match' });
    });

    it('returns noop/no_match for an empty candidate list', () => {
        const result = matchTransaction(
            { utr: '123456789012', amount: 500 },
            []
        );
        expect(result).toEqual({ kind: 'noop', reason: 'no_match' });
    });

    it('returns noop/already_verified when the matching donation is verified', () => {
        const donation = baseDonation({
            verified: true,
            verified_at: '2026-11-03T10:30:00Z',
            verification_method: 'manual',
        });
        const result = matchTransaction({ utr: '123456789012', amount: 500 }, [
            donation,
        ]);
        expect(result).toEqual({ kind: 'noop', reason: 'already_verified' });
    });

    it('picks the correct donation when multiple share an amount', () => {
        // Unique UTR means only one can match.
        const other = baseDonation({ id: 'd-other', utr: '000000000000' });
        const target = baseDonation({ id: 'd-target', utr: '123456789012' });
        const result = matchTransaction({ utr: '123456789012', amount: 500 }, [
            other,
            target,
        ]);
        expect(result).toMatchObject({
            kind: 'autoverify',
            donationId: 'd-target',
        });
    });

    it('does not match on amount alone', () => {
        // UTR differs but amount matches — must NOT autoverify.
        const donation = baseDonation({ utr: '999999999999' });
        const result = matchTransaction({ utr: '123456789012', amount: 500 }, [
            donation,
        ]);
        expect(result.kind).toBe('noop');
    });

    it('is pure — does not mutate the input list', () => {
        const donation = baseDonation();
        const list = [donation];
        const snapshot = JSON.parse(JSON.stringify(list));
        matchTransaction({ utr: '123456789012', amount: 500 }, list);
        expect(list).toEqual(snapshot);
    });
});
