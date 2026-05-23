import { useState, useCallback } from 'react';
import { getVerifiedDonation, insertDonation } from '../api/donation';
import type { DonationData, newDonation } from '../types/donationType';

export function useDonations() {
    const [donations, setDonations] = useState<DonationData[] | []>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState(false);

    // Fetching verified donations (joined with users)
    const loadDonations = useCallback(async () => {
        setLoading(true);
        setError(false);

        try {
            const rawData = await getVerifiedDonation();

            const formatted: DonationData[] = rawData.map(
                (d): DonationData => ({
                    ...d,
                    user_name: d.anonymous ? 'Anonymous' : d.user_name || 'Anonymous',
                }),
            );

            setDonations(formatted);
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add new donation
    const addDonation = useCallback(
        async ({ userId, amount, message, anonymous, utr }: newDonation) => {
            return await insertDonation({ userId, amount, message, anonymous, utr });
        },
        [],
    );

    return { donations, loading, error, addDonation, loadDonations };
}
