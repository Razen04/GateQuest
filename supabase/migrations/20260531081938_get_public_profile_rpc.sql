-- This provides the public profile to anyone via their username

create or replace function get_public_profile(p_username text)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_target_user record;
    v_metrics jsonb;
    v_socials record;
    v_final_json jsonb;
begin
    select id, is_public, name, avatar, username
    into v_target_user
    from public.users
    where username = p_username;

    if not found then
        raise exception 'Profile not found.';
    end if;

    if v_target_user.is_public = false then
        raise exception 'This profile is private.';
    end if;

    v_metrics := calc_user_metrics(v_target_user.id);

    select
        github_url,
        x_url,
        reddit_url,
        spotify_url,
        discord_url,
        linkedin_url
    into v_socials
    from public.users_social
    where user_id = v_target_user.id;

    v_final_json := jsonb_set(
        v_metrics,
        '{profile}',
        (v_metrics->'profile') || jsonb_build_object(
            'name', v_target_user.name,
            'avatar', v_target_user.avatar,
            'username', v_target_user.username,
            'socials', jsonb_build_object(
                'github', v_socials.github_url,
                'x', v_socials.x_url,
                'reddit', v_socials.reddit_url,
                'spotify', v_socials.spotify_url,
                'discord', v_socials.discord_url,
                'linkedin', v_socials.linkedin_url
            )
        )
    );

    return v_final_json;
end;
$$;
