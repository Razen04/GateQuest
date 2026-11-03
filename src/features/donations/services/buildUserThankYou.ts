import type { Donation, NotificationPayload } from '../types/donationType.ts';

const DONATIONS_URL = '/donations';

/** Returns null for guest donors (no user_id) — nothing to notify.
 *  Uses actual_amount because the bank email is the source of truth for
 *  what was really paid; the donor may have paid a different amount than
 *  they selected. */
export function buildUserThankYou(
    donation: Donation
): NotificationPayload | null {
    if (!donation.user_id) return null;
    return {
        title: 'Thank You for Your Donation!',
        message:
            `Your donation of ₹${donation.actual_amount} has been verified. ` +
            `Thank you for supporting GATEQuest!`,
        link: DONATIONS_URL,
        target: { type: 'user', user_id: donation.user_id },
    };
}
