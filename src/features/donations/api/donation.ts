import { supabase } from '@/shared/utils/supabaseClient';
import type { newDonation } from '../types/donationType';

export const getVerifiedDonation = async () => {
    const { data, error } = await supabase.rpc('get_verified_donations');

    if (error) {
        console.error('Error loading donations:', error);
        throw error;
    }

    return data ?? [];
};

export const insertDonation = async ({ userId, amount, message, anonymous, utr }: newDonation) => {
    const { data, error } = await supabase.from('donations').insert([
        {
            user_id: userId ?? null,
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
};
