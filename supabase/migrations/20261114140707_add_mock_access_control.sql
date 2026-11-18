-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: schema + access control foundation
--
-- (consolidated — absorbs patch_user_can_access_mock_for_beta)
--
-- Tables:
--   mocks           — one row per mock; schedule + gating live here
--   mock_questions  — join table (mock_id, question_id, position)
--
-- Helpers:
--   user_has_question_in_session  — RLS helper
--   user_can_access_mock          — query-layer helper
--
-- RLS policy on questions grants participant-only read of mock questions.
-- ═══════════════════════════════════════════════════════════════════
-- ─── Tables ─────────────────────────────────────────────────────
create table if not exists public.mocks (
    id text primary key,
    label text not null,
    branch text not null,
    starts_at timestamptz not null,
    duration_seconds int not null check (duration_seconds > 0),
    attempt_min_tier smallint not null default 0,
    post_min_tier smallint not null default 0,
    series_number int,
    blurb text,
    announcement text,
    status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'live', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_mocks_branch_status on public.mocks (branch, status);

create index if not exists idx_mocks_starts_at on public.mocks (starts_at);

create table if not exists public.mock_questions (
    mock_id text not null references public.mocks (id) on delete cascade,
    question_id uuid not null references public.questions (id) on delete restrict,
    position int not null check (position > 0),
    primary key (mock_id, question_id),
    unique (mock_id, position)
);

create index if not exists idx_mock_questions_question_id on public.mock_questions (question_id);

-- ─── updated_at trigger ─────────────────────────────────────────
create or replace function public.mocks_touch_updated_at ()
    returns trigger
    language plpgsql
    as $$
begin
    new.updated_at := now();
    return NEW;
end;
$$;

drop trigger if exists trg_mocks_updated_at on public.mocks;

create trigger trg_mocks_updated_at
    before update on public.mocks
    for each row
    execute function public.mocks_touch_updated_at ();

-- ─── Helper 1: RLS — does the current user have a session containing this? ───
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

comment on function public.user_has_question_in_session (uuid) is 'True if the current user has any topic_tests_attempts row for this question (ongoing or completed session). Used by the questions RLS policy. Does not check tier — during the exam a free user must see the questions.';

-- ─── Helper 2: query-layer — can this user practice this mock? ───
create or replace function public.user_can_access_mock (p_mock_id text)
    returns boolean
    language plpgsql
    stable
    security definer
    set search_path = 'public'
    as $$
declare
    v_has_completed boolean;
    v_mock_post_min_tier smallint;
    v_my_tier smallint;
begin
    if p_mock_id is null then
        return false;
    end if;
    v_my_tier := coalesce(public.get_my_tier (), 0);
    -- User must have a completed session for this mock
    select
        exists (
            select
                1
            from
                public.topic_tests
            where
                user_id = auth.uid ()
                and status = 'completed'
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%'
                    or paper_id like p_mock_id || '-practice-%'))
    into
        v_has_completed;
    if not v_has_completed then
        return false;
    end if;
    -- Read the mock's gate from the row. Fail closed if missing.
    select
        post_min_tier
    into
        v_mock_post_min_tier
    from
        public.mocks
    where
        id = p_mock_id;
    if v_mock_post_min_tier is null then
        return false;
    end if;
    return v_mock_post_min_tier = 0
        or v_my_tier >= v_mock_post_min_tier;
end;
$$;

grant execute on function public.user_can_access_mock (text) to authenticated;

comment on function public.user_can_access_mock (text) is 'True if the current user has a completed session for this mock AND (mock is beta OR user tier >= post_min_tier). Gate for Practice tab visibility, counts, Smart Revision, and the practice_from_mock RPC.';

-- ─── RLS policy on questions ────────────────────────────────────
drop policy if exists "Enable read access for all users" on public.questions;

drop policy if exists "Read non-mock, or mock within my session" on public.questions;

create policy "Read non-mock, or mock within my session" on public.questions
    for select
    using (not exists (
        select
            1
        from
            public.mock_questions mq
        where
            mq.question_id = questions.id)
            or public.user_has_question_in_session (questions.id));

comment on policy "Read non-mock, or mock within my session" on public.questions is 'Non-mock questions readable by everyone. Mock questions readable only by users who have a session containing them (any status). Access to mock questions in Practice / Smart Revision / Topic Tests is separately gated by user_can_access_mock() at the query layer.';

