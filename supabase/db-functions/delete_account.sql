-- Account deletion: detach identity, keep anonymous activity.
-- The users row is intentionally kept — user_question_activity and the
-- peer-stats aggregates point at it. Deleting it would cascade away the
-- community data, so every identifying field is cleared instead.
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
