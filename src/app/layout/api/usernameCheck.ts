import type { AppUser } from '@/shared/types/AppUser';
import { supabase } from '@/shared/utils/supabaseClient';

export const doesUsernameExists = async (username: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
};

export const handleUsernameSubmittion = async (username: string, user: AppUser) => {
    if (!user.id) return;

    const { error } = await supabase
        .from('users')
        .update({ username, is_public: true })
        .eq('id', user.id);

    return error;
};
