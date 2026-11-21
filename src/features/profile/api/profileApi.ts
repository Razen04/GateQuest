import { supabase } from '@/shared/utils/supabaseClient';
import type { ProfileData } from '../types/profile';

export const getPublicProfile = async (
    username: string
): Promise<ProfileData> => {
    const { data, error } = await supabase.rpc('get_public_profile', {
        p_username: username,
    });

    if (error) throw error;

    return data as unknown as ProfileData;
};

export const searchUsers = async (query: string) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const { data, error } = await supabase.rpc('search_users', {
        search_term: query.trim(),
    });

    if (error) {
        console.error('Search error:', error);
        throw error;
    }

    return data;
};
