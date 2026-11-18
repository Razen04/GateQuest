-- ═══════════════════════════════════════════════════════════════════
-- Account deletion: detach identity, keep anonymous activity
-- ═══════════════════════════════════════════════════════════════════
-- The users row is intentionally kept: user_question_activity and the
-- peer-stats aggregates point at it, and deleting it would cascade away
-- the community data. Instead every identifying field is cleared, the
-- row is soft-deleted, and everything else owned by the user is removed.
-- Reports are kept but detached from the user. Storage objects are
-- deleted too. Public profile reads must ignore soft-deleted users.
-- ═══════════════════════════════════════════════════════════════════

-- Reports survive account deletion. Allow anonymous reports and drop the
-- auth.users FK whose ON DELETE CASCADE used to erase them.
alter table public.question_reports alter column user_id drop not null;

alter table public.question_reports drop constraint if exists fk_question_reports_user;

-- The username guard must permit clearing a username during deletion.
create or replace function public.guard_username_immutable ()
    returns trigger
    language plpgsql
    as $$
begin
    if old.username is not null
        and new.username is distinct from old.username
        and new.deleted_at is null then
        raise exception 'username cannot be changed once set'
            using ERRCODE = '42501';
    end if;
    return NEW;
end;
$$;

-- Do not re-insert a tier-gated AI prompt into the blanked settings of a
-- deleted user.
create or replace function public.guard_ai_custom_prompt ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_new_prompt text;
    v_old_prompt text;
begin
    if new.deleted_at is not null then
        return NEW;
    end if;
    v_new_prompt := new.settings ->> 'aiCustomPrompt';
    v_old_prompt := old.settings ->> 'aiCustomPrompt';
    if v_new_prompt is not distinct from v_old_prompt then
        return NEW;
    end if;
    if public.get_my_tier () >= 1 then
        return NEW;
    end if;
    new.settings := jsonb_set(new.settings, '{aiCustomPrompt}', COALESCE(old.settings -> 'aiCustomPrompt', '""'::jsonb));
    return NEW;
end;
$$;

-- Deleted users must not resolve by username.
create or replace function public.get_public_profile (p_username text)
    returns jsonb
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_viewer_id uuid := auth.uid ();
    v_target_user record;
    v_metrics jsonb;
    v_socials record;
    v_final_json jsonb;
    v_is_owner boolean;
begin
    select
        id,
        is_public,
        show_name,
        name,
        avatar,
        banner,
        notification_tags,
        username,
        about
    into
        v_target_user
    from
        public.users
    where
        username = p_username
        and deleted_at is null;
    if not found then
        raise exception 'Profile not found.';
    end if;
    v_is_owner := (v_viewer_id is not null
        and v_viewer_id = v_target_user.id);
    if not v_target_user.is_public and not v_is_owner then
        raise exception 'This profile is private.';
    end if;
    v_metrics := public.calc_user_metrics (v_target_user.id);
    select
        github_url,
        x_url,
        reddit_url,
        spotify_url,
        discord_url,
        linkedin_url,
        mastodon_url,
        youtube_url,
        lemmy_url,
        leetcode_url,
        codeforces_url
    into
        v_socials
    from
        public.users_social
    where
        user_id = v_target_user.id;
    v_metrics := v_metrics - 'dashboard_stats';
    v_final_json := jsonb_set(v_metrics, '{profile}', (v_metrics -> 'profile') || jsonb_build_object(
            'name', case when v_is_owner
                or v_target_user.show_name then
                v_target_user.name
            else
                'Anonymous User'
            end, 'about', v_target_user.about, 'avatar', v_target_user.avatar, 'banner', v_target_user.banner, 'notification_tags', v_target_user.notification_tags, 'username', v_target_user.username, 'is_public', v_target_user.is_public, 'socials', jsonb_build_object('github', v_socials.github_url, 'x', v_socials.x_url, 'reddit', v_socials.reddit_url, 'spotify', v_socials.spotify_url, 'discord', v_socials.discord_url, 'linkedin', v_socials.linkedin_url, 'mastodon', v_socials.mastodon_url, 'youtube', v_socials.youtube_url, 'lemmy', v_socials.lemmy_url, 'leetcode', v_socials.leetcode_url, 'codeforces', v_socials.codeforces_url)));
    return v_final_json;
end;
$$;

create or replace function public.delete_account ()
    returns void
    language plpgsql
    security definer
    set search_path = auth, public
    as $$
declare
    target_user_id uuid;
begin
    target_user_id := auth.uid ();
    if target_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Sessions and the stuff derived from them. Attempts and revision
    -- questions go via ON DELETE CASCADE.
    delete from public.topic_tests where user_id = target_user_id;

    delete from public.weekly_revision_set where generated_for = target_user_id;

    delete from public.user_incorrect_queue where user_id = target_user_id;

    delete from public.question_bookmarks where user_id = target_user_id;

    delete from public.push_subscriptions where user_id = target_user_id;

    delete from public.user_goals where user_id = target_user_id;

    delete from public.users_social where user_id = target_user_id;

    delete from public.notification_reads where user_id = target_user_id;

    -- Keep the report itself, detach the reporter.
    update public.question_reports
    set user_id = null
    where user_id = target_user_id;

    -- Keep donation history for the ledger, detach the donor.
    update public.donations set user_id = null where user_id = target_user_id;

    -- Public storage objects: path is <user_id>/<epoch>.<ext>.
    -- Supabase guards direct deletes unless this GUC is enabled for the
    -- transaction; the guard is restored immediately afterwards.
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
    where bucket_id in ('avatars', 'banners')
        and (storage.foldername (name))[1] = target_user_id::text;
    perform set_config('storage.allow_delete_query', 'false', true);

    -- Keep the users row for anonymous activity, but strip identity.
    update public.users
    set
        username = null,
        is_public = false,
        name = 'Deleted Account',
        email = 'deleted_' || target_user_id || 'anonymised@local',
        avatar = null,
        banner = null,
        about = null,
        college = null,
        "targetYear" = null,
        show_name = false,
        notification_tags = '{}'::text[],
        settings = '{}'::jsonb,
        bookmark_questions = '{}'::jsonb,
        total_xp = 0,
        deleted_at = now()
    where id = target_user_id;

    delete from auth.users where id = target_user_id;
end;
$$;

-- A fresh account starts at version 1, so allowing up to version 6 gives
-- exactly five resets (the old >= 5 check allowed only four). The column
-- check has to be widened with it.
alter table public.users drop constraint if exists users_max_version_number;

alter table public.users add constraint users_max_version_number check (version_number <= 6);

create or replace function public.clear_user_data ()
    returns jsonb
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_user_id uuid;
    v_user_version_number integer;
begin
    v_user_id := auth.uid ();
    if v_user_id is null then
        raise exception 'Not Authenticated';
    end if;

    select u.version_number
    into v_user_version_number
    from users u
    where u.id = v_user_id;

    if v_user_version_number is null then
        raise exception 'User is missing version number';
    end if;

    if v_user_version_number > 5 then
        raise exception 'Already completed max data clear, cant use more';
    end if;

    update users
    set version_number = v_user_version_number + 1
    where users.id = v_user_id;

    delete from user_incorrect_queue
    where user_id = v_user_id;

    delete from weekly_revision_set
    where generated_for = v_user_id;

    delete from topic_tests
    where user_id = v_user_id;

    return jsonb_build_object(
        'status', 'ok',
        'version', v_user_version_number + 1
    );
end;
$$;
