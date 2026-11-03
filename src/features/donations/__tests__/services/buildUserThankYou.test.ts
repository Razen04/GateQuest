import { describe, expect, it } from 'vitest';
import { buildUserThankYou } from '../../services/buildUserThankYou.ts';
import type { Donation } from '../../types/donationType.ts';

const USER_ID = '22222222-2222-2222-2222-222222222222';

const donation = (overrides: Partial<Donation> = {}): Donation => ({
    id: 'd-42',
    user_id: USER_ID,
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

describe('buildUserThankYou', () => {
    it('returns null when the donation has no user_id (guest donor)', () => {
        expect(buildUserThankYou(donation({ user_id: null }))).toBeNull();
    });

    it('targets the donor via target.type=user', () => {
        const payload = buildUserThankYou(donation());
        expect(payload).not.toBeNull();
        expect(payload!.target).toEqual({ type: 'user', user_id: USER_ID });
    });

    it('includes a title, message, and link', () => {
        const payload = buildUserThankYou(donation())!;
        expect(payload.title).toBeTruthy();
        expect(payload.message).toBeTruthy();
        expect(payload.link).toBeTruthy();
    });

    it('uses actual_amount, not suggested_amount, in the message', () => {
        // Donor selected 500 but paid 450.
        const payload = buildUserThankYou(
            donation({ suggested_amount: 500, actual_amount: 450 })
        )!;
        expect(payload.message).toContain('450');
        expect(payload.message).not.toContain('500');
    });

    it('thanks the donor', () => {
        const payload = buildUserThankYou(donation())!;
        expect(payload.message.toLowerCase()).toMatch(/thank/);
    });

    it('does not include email-derived content (privacy)', () => {
        const payload = buildUserThankYou(donation())!;
        expect(payload.message.toLowerCase()).not.toContain('balance');
        expect(payload.message.toLowerCase()).not.toContain('canara');
    });

    it('does not set audience_ids — let the trigger resolve it', () => {
        const payload = buildUserThankYou(donation())!;
        expect(payload).not.toHaveProperty('audience_ids');
    });
});
