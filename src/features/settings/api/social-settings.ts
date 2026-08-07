import type { AppUser } from '@/shared/types/AppUser';
import { supabase } from '@/shared/utils/supabaseClient';

export const getSocialSettingsValue = async (user: AppUser) => {
    if (!user?.id) return;

    const { data, error } = await supabase
        .from('users_social')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;

    return data;
};

export const handleUpdateSocialSettings = async (
    formData: FormData,
    user: AppUser
) => {
    if (!user) return;

    const { error } = await supabase.from('users_social').upsert({
        user_id: user.id,
        github_url: formData.get('github_url')?.toString() || null,
        x_url: formData.get('x_url')?.toString() || null,
        linkedin_url: formData.get('linkedin_url')?.toString() || null,
        reddit_url: formData.get('reddit_url')?.toString() || null,
        spotify_url: formData.get('spotify_url')?.toString() || null,
        discord_url: formData.get('discord_url')?.toString() || null,
        mastodon_url: formData.get('mastodon_url')?.toString() || null,
        youtube_url: formData.get('youtube_url')?.toString() || null,
        lemmy_url: formData.get('lemmy_url')?.toString() || null,
    });

    return error;
};
