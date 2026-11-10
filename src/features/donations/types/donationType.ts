export type DonationData = {
    donation_id: string;
    user_id: string;
    anonymous: boolean;
    message: string | null;
    actual_amount: number;
    verified: boolean;
    created_at: string;
    user_name: string;
    user_avatar: string;
};

export type newDonation = {
    userId: string | null;
    amount: number;
    message: string | null;
    anonymous: boolean;
    utr: string;
};

export interface Donation {
    id: string;
    user_id: string | null;
    anonymous: boolean;
    message: string | null;
    suggested_amount: number;
    actual_amount: number;
    utr: string;
    verified: boolean;
    created_at: string;
    verified_at: string | null;
    verified_by: 'manual' | 'auto' | null;
    review_alerted_at: string | null;
}

export interface NotificationPayload {
    title: string;
    message: string;
    link: string;
    target: { type: 'user'; user_id: string };
}
