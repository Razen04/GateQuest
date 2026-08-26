create or replace function get_public_profile(p_username text)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_viewer_id uuid := auth.uid();
    v_target_user record;
    v_metrics jsonb;
    v_socials record;
    v_final_json jsonb;
    v_is_owner boolean;
begin
    select id, is_public, show_name, name, avatar, username, about
    into v_target_user
    from public.users
    where username = p_username;

    if not found then
        raise exception 'Profile not found.';
    end if;

    v_is_owner := (v_viewer_id is not null and v_viewer_id = v_target_user.id);

    -- Allow access if the profile is public OR if the caller is the account owner
    if not v_target_user.is_public and not v_is_owner then
        raise exception 'This profile is private.';
    end if;

    v_metrics := calc_user_metrics(v_target_user.id);

    select github_url, x_url, reddit_url, spotify_url, discord_url, linkedin_url, mastodon_url, youtube_url, lemmy_url, leetcode_url, codeforces_url
    into v_socials
    from public.users_social
    where user_id = v_target_user.id;

    -- Strip out the private dashboard_stats key for public viewing
    v_metrics := v_metrics - 'dashboard_stats';

    v_final_json := jsonb_set(
        v_metrics,
        '{profile}',
        (v_metrics->'profile') || jsonb_build_object(
            -- If owner is viewing, show actual name regardless of show_name toggle
            'name', case 
                when v_is_owner or v_target_user.show_name then v_target_user.name 
                else 'Anonymous User' 
            end,
            'about', v_target_user.about,
            'avatar', v_target_user.avatar,
            'username', v_target_user.username,
            'is_public', v_target_user.is_public,
            'socials', jsonb_build_object(
                'github', v_socials.github_url,
                'x', v_socials.x_url,
                'reddit', v_socials.reddit_url,
                'spotify', v_socials.spotify_url,
                'discord', v_socials.discord_url,
                'linkedin', v_socials.linkedin_url,
                'mastodon', v_socials.mastodon_url,
                'youtube', v_socials.youtube_url,
                'lemmy', v_socials.lemmy_url,
								'leetcode', v_socials.leetcode_url,
								'codeforces', v_socials.codeforces_url
            )
        )
    );

    return v_final_json;
end;
$$;
