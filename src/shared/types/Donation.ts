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
    userId: string | null | undefined;
    amount: number;
    message: string | null;
    anonymous: boolean;
    utr: string;
};
