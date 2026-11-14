-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: access control foundation
--
-- Two functions and one RLS policy replacement. No user-facing change:
-- no mock questions exist yet, so the policy change is a no-op on
-- current data. It exists to block the pre-live dump and cross-user
-- dump the moment mock questions start being authored (Phase 4+).
--
-- The RLS policy uses a SECURITY DEFINER helper (user_has_question_in_
-- session) rather than inlining the EXISTS subquery, so the check:
--   · doesn't trigger recursive RLS on topic_tests_attempts/topic_tests
--   · uses the existing (session_id, question_id) PK path efficiently
--   · has one canonical definition rather than a copy inside the policy
--
-- No index is added in this migration. topic_tests_attempts has no
-- standalone question_id index — the RLS policy's per-row check runs
-- against the composite PK. Fine at current volumes (0 mock questions
-- today). Add idx_attempts_question_id before any production mock
-- exceeds a few hundred attempts. Flagged for Phase 4 pre-launch.
-- ═══════════════════════════════════════════════════════════════════
-- ─── Helper 1: does the current user have a session containing this? ───
-- Used by the RLS policy. Returns true if the specific question id
-- appears in any of the current user's topic_tests_attempts rows —
-- ongoing or completed. During the exam the session is 'ongoing' and
-- the user must see the questions; after submit it's 'completed' and
-- the user may still view them.
create or replace function public.user_has_question_in_session (p_question_id uuid)
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
                public.topic_tests_attempts a
                join public.topic_tests t on t.id = a.session_id
            where
                a.question_id = p_question_id
                and t.user_id = auth.uid ());
$$;

grant execute on function public.user_has_question_in_session (uuid) to authenticated, anon;

comment on function public.user_has_question_in_session (uuid) is 'True if the current user has any topic_tests_attempts row for this question (ongoing or completed session). Used by the questions RLS policy to grant visibility to participants only. Does not check tier — during the exam a free user must see the questions.';

-- ─── Helper 2: can the current user practice this mock in the app flow? ───
-- Used by Phase 3's query filters (Practice, Smart Revision, Topic Tests).
-- Stricter than Helper 1: requires tier-1+ AND a COMPLETED session for
-- the mock. Ongoing sessions do not grant access to the practice flow —
-- the exam must be finished first.
create or replace function public.user_can_access_mock (p_mock_id text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        p_mock_id is not null
        and coalesce(public.get_my_tier (), 0) >= 1
        and exists (
            select
                1
            from
                public.topic_tests
            where
                user_id = auth.uid ()
                and status = 'completed'
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%' -- re-attempts
                    or paper_id like p_mock_id || '-practice-%' -- practice from mock
));
$$;

grant execute on function public.user_can_access_mock (text) to authenticated;

comment on function public.user_can_access_mock (text) is 'True if the current user is a donor (tier-1+) and has a completed session for the given mock. Used by Phase 3''s content query filters to gate mock questions out of Practice / Smart Revision / Topic Tests for non-donors and non-participants.';

-- ─── RLS policy replacement on questions ──────────────────────────
-- Before: USING (true) — any authenticated user could dump a mock's
-- questions AND correct_answer before the mock went live. Serious leak.
--
-- After:  non-mock questions readable by everyone (existing behavior
-- preserved for the ~99% of questions that aren't mocks); mock
-- questions readable only by users who have a session containing them.
--
-- Free users who took a mock can still read its questions after submit
-- (session exists) — they already saw them, no new information leaks.
-- The premium gate is applied at the query layer in Phase 3, not here.
drop policy if exists "Enable read access for all users" on public.questions;

create policy "Read non-mock, or mock within my session" on public.questions
    for select
    using (
    -- All non-mock questions: readable by everyone. Preserves existing
    -- behavior for practice, PYQ tests, etc.
    metadata ->> 'mockId' is null
        or
        -- Mock questions: readable only if the current user has a session
        -- (ongoing or completed) containing this specific question. Blocks
        -- the pre-live dump and cross-user dumps.
        public.user_has_question_in_session (questions.id));

comment on policy "Read non-mock, or mock within my session" on public.questions is 'Non-mock questions readable by everyone. Mock questions readable only by users who have a session containing them (any status). Access to mock questions in Practice / Smart Revision / Topic Tests is separately gated by user_can_access_mock() at the query layer.';

