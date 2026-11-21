begin;
select
    plan (4);
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values ('mock-rls-test', 'RLS Test', 'cs', now(), 3600, 0, 0, 'live')
on conflict (id)
    do nothing;
-- ─── Act as a normal signed-in client ─────────────────────────────
set local role authenticated;
select
    set_config('request.jwt.claims', '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "role": "authenticated"}', true);
-- Catalog rows stay readable.
select
    is ((
            select
                count(*)::int
            from
                public.mocks
            where
                id = 'mock-rls-test'), 1, 'authenticated can read the mock catalog');
-- Writes are blocked by privileges + RLS.
select
    throws_ok ($$
        insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
            values ('mock-rls-hack', 'Hacked', 'cs', now(), 60, 0, 0, 'live') $$, '42501', null, 'authenticated cannot insert mocks');
select
    throws_ok ($$
        update public.mocks
        set label = 'Hacked'
        where id = 'mock-rls-test' $$, '42501', null, 'authenticated cannot update mocks');
-- Question membership is not client-readable.
select
    throws_ok ($$
        select
            1
        from public.mock_questions
        limit 1 $$, '42501', null, 'authenticated cannot read mock_questions directly');
select
    *
from
    finish ();
rollback;
