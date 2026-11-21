-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: Practice tab read path
--
-- Uses mock_questions as the source of truth for mock membership.
--
-- Non-mock questions remain available normally.
-- Mock questions require user_can_access_mock() authorization.
--
-- Delta sync preserved via p_last_fetched_at.
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.fetch_practice_questions (p_subject_id uuid, p_last_fetched_at timestamptz default null)
    returns setof public.questions
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        q.*
    from
        public.questions q
    where
        q.verified = true
        and q.subject_id = p_subject_id
        and (p_last_fetched_at is null
            or q.updated_at > p_last_fetched_at)
        and (not exists (
                select
                    1
                from
                    public.mock_questions mq
                where
                    mq.question_id = q.id)
                or exists (
                    select
                        1
                    from
                        public.mock_questions mq
                    where
                        mq.question_id = q.id
                        and public.user_can_access_mock (mq.mock_id)));
$$;

grant execute on function public.fetch_practice_questions (uuid, timestamptz) to authenticated;

comment on function public.fetch_practice_questions (uuid, timestamptz) is 'Practice tab read path. Returns verified questions for a subject, excluding mock questions unless the caller has completed a session for the mock and satisfies its post_min_tier gate. Supports delta sync via p_last_fetched_at.';

