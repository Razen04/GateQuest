import { supabase } from '@/shared/utils/supabaseClient';

export const getPublicProfile = async (username: string) => {
    const { data, error } = await supabase.rpc('get_public_profile', {
        p_username: username,
    });

    if (error) throw error;

    return data;
};
