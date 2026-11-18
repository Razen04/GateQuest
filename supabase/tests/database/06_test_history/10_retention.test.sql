begin;
select
    plan (9);

\set free_user  'f0000000-0000-4000-8000-000000000001'
\set donor_user 'f0000000-0000-4000-8000-000000000002'
\set anchor     '2026-01-01 00:00:00+00'

-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'free_user', 'retention-free@test.com'), (:'donor_user', 'retention-donor@test.com')
on conflict (id)
    do nothing;

insert into public.users (id, username, name)
    values (:'free_user', 'retention-free', 'Free'), (:'donor_user', 'retention-donor', 'Donor')
on conflict (id)
    do nothing;

update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'free_user';

update
    public.users
set
    notification_tags = array['donor:tier-1']
where
    id = :'donor_user';

create or replace function _ins_history (
    p_user uuid,
    p_branch text,
    p_count int,
    p_anchor timestamptz
)
    returns void
    language plpgsql
    as $$
begin
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, completed_at)
    select
        p_user,
        array['T'],
        1,
        100,
        'completed',
        1,
        p_branch,
        null,
        p_anchor - (i || ' hours')::interval
    from
        generate_series (1, p_count) i;
end;
$$;

-- Free user: 12 completed non-mock sessions in each of two branches.
select
    _ins_history (:'free_user', 'cs', 12, :'anchor');

select
    _ins_history (:'free_user', 'me', 12, :'anchor');

-- Old official mocks (including a re-attempt) must survive forever.
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, completed_at)
    values (:'free_user', array['Mock'], 1, 100, 'completed', 1, 'cs', 'mock-retention-1', :'anchor'::timestamptz - interval '20 hours'), (:'free_user', array['Mock'], 1, 100, 'completed', 1, 'cs', 'mock-retention-1-r2', :'anchor'::timestamptz - interval '30 hours');

-- Practice derived from a mock is ordinary history and is pruned.
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, completed_at)
    values (:'free_user', array['Practice'], 1, 100, 'completed', 1, 'cs', 'mock-retention-1-practice-123', :'anchor'::timestamptz - interval '13 hours');

-- An in-progress session is never pruned.
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id)
    values (:'free_user', array['T'], 1, 100, 'ongoing', 1, 'cs', null);

-- Donor: 12 completed sessions, none may be pruned.
select
    _ins_history (:'donor_user', 'cs', 12, :'anchor');

-- ─── Run retention ────────────────────────────────────────────────
-- free/cs: 13 prunable rows (12 tests + practice) -> 3 deleted
-- free/me: 12 prunable rows -> 2 deleted
-- donor: exempt -> 0
select
    is (public.prune_topic_test_history (), 5, 'prunes only the free-tier overflow');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and branch_id = 'cs'
                and status = 'completed'
                and (paper_id is null
                    or paper_id not like 'mock-%'
                    or paper_id like '%-practice-%')), 10, 'free tier keeps 10 non-mock sessions per branch');

select
    is ((
            select
                min(completed_at)
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and branch_id = 'cs'
                and status = 'completed'
                and (paper_id is null
                    or paper_id not like 'mock-%'
                    or paper_id like '%-practice-%')), :'anchor'::timestamptz - interval '10 hours', 'the newest 10 are the ones kept');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and paper_id like 'mock-%'
                and paper_id not like '%-practice-%'), 2, 'official mock attempts are never pruned');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and paper_id like '%-practice-%'), 0, 'practice-from-mock is pruned like normal history');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and status <> 'completed'), 1, 'in-progress sessions are never pruned');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'donor_user'
                and status = 'completed'), 12, 'donors keep unlimited history');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'free_user'
                and branch_id = 'me'), 10, 'retention is scoped per branch');

-- ─── Privileges ───────────────────────────────────────────────────
-- The function bypasses RLS and prunes every user, so clients must
-- never be able to trigger it.
set local role authenticated;
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'free_user', 'role', 'authenticated')::text, true);
select
    throws_ok ($$ select public.prune_topic_test_history(); $$, '42501', null, 'authenticated cannot run retention');
reset role;

select
    *
from
    finish ();
rollback;
