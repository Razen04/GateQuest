-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: Practice tab read path
--
-- New RPC replacing the client's direct query in useQuestions.ts. The
-- current path is:
--   supabase.from('questions').select('*').eq('verified', true)
--     .eq('subject_id', X).gt('updated_at', lastFetched)
--
-- That query goes through RLS, which (per Phase 1) grants read access
-- to ANY participant session — including free users. So mock questions
-- would be visible to free users in Practice.
--
-- The premium gate is stricter than RLS: tier-1+ AND completed session.
-- That's what user_can_access_mock() expresses. This RPC applies that
-- stricter filter server-side, so free users never receive mock
-- questions in the response — closing both the UI leak and the network
-- inspection vector.
--
-- Delta sync preserved via p_last_fetched_at. When NULL, returns all;
-- when set, returns only updated_at > p_last_fetched_at.
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.fetch_practice_questions (p_subject_id uuid, p_last_fetched_at timestamptz default null)
    returns setof public.questions
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        *
    from
        public.questions
    where
        verified = true
        and subject_id = p_subject_id
        and (p_last_fetched_at is null
            or updated_at > p_last_fetched_at)
        and (metadata ->> 'mockId' is null
            or public.user_can_access_mock (metadata ->> 'mockId'));
$$;

grant execute on function public.fetch_practice_questions (uuid, timestamptz) to authenticated;

comment on function public.fetch_practice_questions (uuid, timestamptz) is 'Practice tab read path. Returns verified questions for a subject, excluding mock questions unless the caller is tier-1+ with a completed session for that mock. Supports delta sync via p_last_fetched_at.';

