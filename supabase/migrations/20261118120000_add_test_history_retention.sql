-- ═══════════════════════════════════════════════════════════════
-- Test history retention
-- ═══════════════════════════════════════════════════════════════
-- Free users only keep the newest 10 completed non-mock sessions
-- per (user, branch). Donors (tier >= 1) are exempt forever.
--
-- Live mock attempts are NEVER pruned. The leaderboard, catalog,
-- result pages and the `already_attempted` gate all read
-- `topic_tests`, so deleting a mock row would corrupt official
-- standings and re-open the attempt.
--
-- Practice sessions derived from a mock (`mock-*-practice-*`) are
-- ordinary practice tests and are pruned like any other history.
--
-- Attempts are removed by the existing ON DELETE CASCADE on
-- `topic_tests_attempts`. Long-term analytics live in
-- `user_question_activity`, which this function does not touch.

-- Partial index that makes the per-user/per-branch ranking cheap.
create index if not exists idx_topic_tests_user_branch_completed
    on public.topic_tests (user_id, branch_id, completed_at desc)
    where completed_at is not null;

-- Cron runs without an auth session, so `get_my_tier()` (which
-- reads `auth.uid()`) cannot be used here. This is the same tier
-- derivation, parameterised by user id.
create or replace function public.get_user_tier (p_user_id uuid)
    returns smallint
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        coalesce(
            case
                when 'donor:tier-3' = any (notification_tags) then 3
                when 'donor:tier-2' = any (notification_tags) then 2
                when 'donor:tier-1' = any (notification_tags) then 1
                else 0
            end, 0)::smallint
    from
        public.users
    where
        id = p_user_id;
$$;

revoke all on function public.get_user_tier (uuid) from public;

revoke all on function public.get_user_tier (uuid) from anon, authenticated;

grant execute on function public.get_user_tier (uuid) to service_role;

create or replace function public.prune_topic_test_history ()
    returns integer
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_deleted integer;
begin
    with rankable as (
        select
            t.id,
            row_number() over (
                partition by t.user_id, t.branch_id
                order by
                    t.completed_at desc nulls last,
                    t.created_at desc nulls last,
                    t.id desc
            ) as rn
        from
            public.topic_tests t
        where
            t.status = 'completed'
            -- Free tier only.
            and public.get_user_tier (t.user_id) < 1
            -- Official mock attempts (including -r2 re-attempts) are
            -- exempt. NULL paper_id = custom topic test.
            and (t.paper_id is null
                or t.paper_id not like 'mock-%'
                or t.paper_id like '%-practice-%')
    ),
    doomed as (
        select
            id
        from
            rankable
        where
            rn > 10
    ),
    deleted as (
        delete from public.topic_tests t
        using doomed d
        where
            t.id = d.id
        returning
            t.id
    )
    select
        count(*) into v_deleted
    from
        deleted;

    return v_deleted;
end;
$$;

comment on function public.prune_topic_test_history () is
'Deletes completed non-mock test sessions beyond the newest 10 per (user, branch) for free users. Donors and official mock attempts are never pruned.';

revoke all on function public.prune_topic_test_history () from public;

revoke all on function public.prune_topic_test_history () from anon, authenticated;

grant execute on function public.prune_topic_test_history () to service_role;

-- Cron-only. It bypasses RLS and must not be callable by clients.
select
    cron.schedule ('prune-topic-test-history', '0 4 * * *', $cron$select public.prune_topic_test_history();$cron$);
