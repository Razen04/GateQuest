import { supabase } from '@/shared/utils/supabaseClient';

// Get the current user
export const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
};
