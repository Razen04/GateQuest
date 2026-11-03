import { describe, expect, it } from 'vitest';
import { buildAdminAlert } from '../../services/buildAdminAlert.ts';
import type { Donation } from '../../types/donationType.ts';

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

const donation = (overrides: Partial<Donation> = {}): Donation => ({
    id: 'd-42',
    user_id: '11111111-1111-1111-1111-111111111111',
    anonymous: false,
    message: 'Keep going!',
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

describe('buildAdminAlert', () => {
    it('targets the admin user via target.type=user', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload.target).toEqual({ type: 'user', user_id: ADMIN_ID });
    });

    it('includes a title, message, and link', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload.title).toBeTruthy();
        expect(payload.message).toBeTruthy();
        expect(payload.link).toBeTruthy();
    });

    it('mentions the UTR and amount in the message', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload.message).toContain('123456789012');
        expect(payload.message).toContain('500');
    });

    it('mentions the reason (pending over 1 hour)', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload.message.toLowerCase()).toMatch(/pending|review|hour/);
    });

    it('does not include the donor-supplied public message', () => {
        // The donor's public note should not appear in an admin alert payload.
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload.message).not.toContain('Keep going!');
    });

    it('does not include any email-derived content (privacy)', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        // No account numbers, no balance, no "Canara", no email-body phrases
        expect(payload.message.toLowerCase()).not.toContain('balance');
        expect(payload.message.toLowerCase()).not.toContain('canara');
        expect(payload.message.toLowerCase()).not.toContain('xxxx0201');
    });

    it('does not set audience_ids — let the trigger resolve it', () => {
        const payload = buildAdminAlert(donation(), ADMIN_ID);
        expect(payload).not.toHaveProperty('audience_ids');
    });
});
