import type { Donation, NotificationPayload } from '../types/donationType.ts';

const ADMIN_DONATIONS_URL = '/admin/donations';

/** Builds the admin-facing review alert. Contains only the parsed
 *  donation fields — never the donor's public message and never any
 *  email-derived content (privacy constraint from the issue). */
export function buildAdminAlert(
    donation: Donation,
    adminId: string
): NotificationPayload {
    return {
        title: 'Donation Needs Manual Review',
        message:
            `Donation ${donation.id} (UTR ${donation.utr}, ` +
            `₹${donation.suggested_amount}) has been pending for over 1 hour. ` +
            `Please review.`,
        link: ADMIN_DONATIONS_URL,
        target: { type: 'user', user_id: adminId },
    };
}
