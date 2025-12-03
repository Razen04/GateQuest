import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient.ts';
import type { DonationData, newDonation } from '../types/Donation.ts';

export function useDonations() {
    const [donations, setDonations] = useState<DonationData[] | []>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState(false);

    // Fetching verified donations (joined with users)
    const loadDonations = useCallback(async () => {
        setLoading(true);
        const { data, error: SupabaseError } = await supabase.rpc('get_verified_donations');

        if (SupabaseError) {
            console.error('Error loading donations:', SupabaseError);

            setError(true);

            setLoading(false);
            return;
        }

        // Now this part will work again
        const rawData = data || [];

        const formatted: DonationData[] = rawData.map((d: DonationData) => ({
            ...d,
            user_name: d.anonymous ? 'Anonymous' : d.user_name || 'Anonymous',
        }));

        setDonations(formatted);
        setLoading(false);
    }, []);

    // Add new donation
    const addDonation = useCallback(
        async ({ userId, amount, message, anonymous, utr }: newDonation) => {
            const { data, error } = await supabase.from('donations').insert([
                {
                    user_id: userId,
                    suggested_amount: amount,
                    actual_amount: amount,
                    message: message || null,
                    anonymous,
                    utr,
                },
            ]);

            if (error) {
                console.error('Error adding donation:', error);
                throw error;
            }

            return data;
        },
        [],
    );

    return { donations, loading, error, addDonation, loadDonations };
}
