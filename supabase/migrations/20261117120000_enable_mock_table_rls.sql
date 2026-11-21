-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: lock down `mocks` and `mock_questions`
--
-- Both tables were created without RLS. Supabase's default public-schema
-- grants expose tables to `anon` / `authenticated`, so PostgREST clients
-- could read *and write* schedules and question membership directly,
-- bypassing every gate in the security-definer RPCs.
--
-- Policy:
--   mocks           — public read (catalog is not sensitive), no writes.
--   mock_questions  — no client access. Membership is internal; clients
--                     read it only through security-definer RPCs.
--
-- The `questions` RLS policy used to test membership with a subquery on
-- `mock_questions` as the caller. That would silently become "read every
-- mock question" once RLS hides the join table, so the subquery is
-- replaced with the security-definer helper `is_mock_question()`.
-- ═══════════════════════════════════════════════════════════════════

alter table public.mocks enable row level security;
alter table public.mock_questions enable row level security;

-- Defense in depth: RLS blocks writes, and so do table privileges.
revoke insert, update, delete, truncate on public.mocks from anon, authenticated;
revoke insert, update, delete, truncate on public.mock_questions from anon, authenticated;
-- Membership is not part of the public API.
revoke select on public.mock_questions from anon, authenticated;

grant select on public.mocks to anon, authenticated;

drop policy if exists "Anyone can read mock catalog" on public.mocks;

create policy "Anyone can read mock catalog" on public.mocks
    for select
    to anon, authenticated
    using (true);

-- ─── Security-definer membership check for the questions policy ──
create or replace function public.is_mock_question (p_question_id uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        exists (
            select
                1
            from
                public.mock_questions mq
            where
                mq.question_id = p_question_id);
$$;

grant execute on function public.is_mock_question (uuid) to anon, authenticated;

comment on function public.is_mock_question (uuid) is 'True if the question belongs to a mock. Security-definer helper so the questions RLS policy can check membership without granting clients SELECT on mock_questions.';

drop policy if exists "Read non-mock, or mock within my session" on public.questions;

create policy "Read non-mock, or mock within my session" on public.questions
    for select
    using (
        not public.is_mock_question (questions.id)
        or public.user_has_question_in_session (questions.id));

comment on policy "Read non-mock, or mock within my session" on public.questions is 'Non-mock questions readable by everyone. Mock questions readable only by users who have a session containing them (any status). Practice / Smart Revision / Topic Tests apply the stricter user_can_access_mock() gate at the query layer.';
