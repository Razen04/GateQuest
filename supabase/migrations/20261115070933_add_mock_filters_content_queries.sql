-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: content query filters
--
-- Adds the mock-question filter to five functions that read `questions`
-- and would otherwise surface mock content to free users. Same filter
-- everywhere: exclude mock questions unless the caller is a donor
-- (tier-1+) with a completed session for that mock.
--
-- Filter:
--   AND (q.metadata->>'mockId' IS NULL
--        OR public.user_can_access_mock(q.metadata->>'mockId'))
--
-- Also fixes two pre-existing bugs in generate_topic_test:
--   1. Missing `q.verified = true` in the pool CTE. Unverified/broken
--      questions could leak into practice tests. Closed now.
--   2. sum(marks) could return NULL if all questions had null marks.
--      Wrapped in coalesce. Zero-risk.
--
-- Adds a supporting index for user_can_access_mock() at scale.
--
-- Deferred (with a note in generate_topic_test): p_total_seconds is
-- accepted but ignored. The function hardcodes v_actual_count * 162.
-- Fixing that is a separate PR.
-- ═══════════════════════════════════════════════════════════════════
-- ─── Index for user_can_access_mock() ─────────────────────────────
-- Without this, every mock question in a subject list triggers a
-- sequential scan of topic_tests for the EXISTS check. The index makes
-- the filter cheap even at thousands of mock questions.
create index if not exists idx_topic_tests_user_paper_completed on public.topic_tests (user_id, paper_id)
where
    status = 'completed';

-- ─── get_topic_counts ─────────────────────────────────────────────
create or replace function public.get_topic_counts (p_subject_id uuid)
    returns table (
        topic text,
        question_count bigint,
        unattempted_count bigint,
        subject_id uuid)
    language plpgsql
    as $$
declare
    v_user_version int;
begin
    select
        version_number
    into
        v_user_version
    from
        users
    where
        id = auth.uid ();
    return query
    select
        q.topic,
        COUNT(*) as question_count,
        COUNT(*) filter (where not exists (
            select
                1 from user_question_activity uqa where uqa.question_id = q.id
                and uqa.user_id = auth.uid ()
                and uqa.user_version_number = v_user_version)) as unattempted_count,
    p_subject_id as subject_id
from
    questions q
where
    q.subject_id = p_subject_id
        and q.topic is not null
        and q.verified = true
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
                        and public.user_can_access_mock (mq.mock_id)))
        group by
            q.topic;
end;
$$;

-- ─── get_exam_subject_counts ──────────────────────────────────────
create or replace function public.get_exam_subject_counts (target_exams text[])
    returns table (
        subject_id uuid,
        exam_specific_count bigint
    )
    as $$
begin
    return query
    select
        q.subject_id,
        COUNT(distinct q.id) as exam_specific_count
    from
        questions q
        join subjects s on q.subject_id = s.id
        cross join lateral jsonb_array_elements_text(
            case when jsonb_typeof(q.metadata -> 'exam') = 'array' then
                q.metadata -> 'exam'
            when q.metadata -> 'exam' is not null then
                jsonb_build_array(q.metadata ->> 'exam')
            else
                '["GATE"]'::jsonb
            end) as expanded_tags (tag)
where (s.is_universal = true
        or expanded_tags.tag = any (target_exams))
        and q.verified = true
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
                        and public.user_can_access_mock (mq.mock_id)))
        group by
            q.subject_id;
end;
$$
language plpgsql;

-- ─── get_critical_question_count ──────────────────────────────────
create or replace function public.get_critical_question_count (p_valid_subjects uuid[])
    returns integer
    as $$
declare
    v_count integer;
    v_current_branch_id text;
begin
    select
        branch_id
    into
        v_current_branch_id
    from
        public.user_goals
    where
        user_id = auth.uid ()
    limit 1;
    select
        COUNT(distinct uiq.question_id)
    into
        v_count
    from
        user_incorrect_queue uiq
        join questions q on uiq.question_id = q.id
        join subjects s on q.subject_id = s.id
    where
        uiq.user_id = auth.uid ()
        and uiq.next_review_at <= NOW()
        and q.subject_id = any (p_valid_subjects)
        and q.verified = true
        and (s.is_universal = true
            or q.metadata ->> 'set' = UPPER(v_current_branch_id))
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
    return v_count;
end;
$$
language plpgsql;

-- ─── generate_weekly_revision_set ─────────────────────────────────
create or replace function public.generate_weekly_revision_set (p_valid_subjects uuid[], p_target_exams text[], p_branch_id text)
    returns json
    as $$
declare
    v_user_id uuid;
    v_set_id uuid;
    v_start_of_week date;
    v_questions_added int;
    v_has_eligible boolean;
begin
    v_user_id := auth.uid ();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    v_start_of_week := (current_date - EXTRACT(DOW from current_date)::int)::date;
    -- Existing set for this week?
    select
        id
    into
        v_set_id
    from
        weekly_revision_set
    where
        generated_for = v_user_id
        and start_of_week = v_start_of_week
        and branch_id = p_branch_id;
    if v_set_id is not null then
        return json_build_object('success', true, 'status', 'existing', 'message', 'Set already present for this week.');
    end if;
    -- Quick eligibility check.
    select
        exists (
            select
                1
            from
                user_incorrect_queue uiq
                join questions q on uiq.question_id = q.id
                join subjects s on q.subject_id = s.id
                cross join lateral jsonb_array_elements_text(
                    case when jsonb_typeof(q.metadata -> 'exam') = 'array' then
                        q.metadata -> 'exam'
                    when q.metadata -> 'exam' is not null then
                        jsonb_build_array(q.metadata ->> 'exam')
                    else
                        '[]'::jsonb
                    end) as expanded_tags (tag)
            where
                uiq.user_id = v_user_id
                and uiq.next_review_at <= NOW()
                and q.subject_id = any (p_valid_subjects)
                and q.verified = true
                and (s.is_universal = true
                    or (q.metadata ->> 'set' = UPPER(p_branch_id)
                        or expanded_tags.tag = any (p_target_exams)))
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
                                and public.user_can_access_mock (mq.mock_id)))
                    limit 1)
        into
            v_has_eligible;
    if not v_has_eligible then
        return json_build_object('success', true, 'status', 'empty', 'message', 'No questions due for review this week.');
    end if;
    -- Create the set header.
    insert into weekly_revision_set (generated_for, start_of_week, status, created_at, exam_tags, branch_id)
        values (v_user_id, v_start_of_week, 'pending', now(), p_target_exams, p_branch_id)
    returning
        id
    into
        v_set_id;
    with RankedQueue as (
        select distinct on (uiq.question_id)
            uiq.question_id,
            uiq.box,
            uiq.added_at
        from
            user_incorrect_queue uiq
            join questions q on uiq.question_id = q.id
            join subjects s on q.subject_id = s.id
            cross join lateral jsonb_array_elements_text(
                case when jsonb_typeof(q.metadata -> 'exam') = 'array' then
                    q.metadata -> 'exam'
                when q.metadata -> 'exam' is not null then
                    jsonb_build_array(q.metadata ->> 'exam')
                else
                    '[]'::jsonb
                end) as expanded_tags (tag)
        where
            uiq.user_id = v_user_id
            and uiq.next_review_at <= NOW()
            and q.subject_id = any (p_valid_subjects)
            and q.verified = true
            and (s.is_universal = true
                or (q.metadata ->> 'set' = UPPER(p_branch_id)
                    or expanded_tags.tag = any (p_target_exams)))
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
                            and public.user_can_access_mock (mq.mock_id))))
        insert into revision_set_questions (set_id, question_id)
    select
        v_set_id,
        question_id
    from
        RankedQueue
    order by
        box asc,
        added_at asc
    limit 30;
    GET DIAGNOSTICS v_questions_added = ROW_COUNT;
    update
        weekly_revision_set
    set
        total_questions = v_questions_added
    where
        id = v_set_id;
    return json_build_object('success', true, 'status', 'created', 'message', 'Generated new smart revision set.');
exception
    when others then
        raise exception 'Failed to generate revision set: %', SQLERRM;
end;

$$
language plpgsql;

-- ─── generate_topic_test ──────────────────────────────────────────
-- NOTE: p_total_seconds is accepted but IGNORED. The function computes
-- v_actual_count * 162. Fixing that is a separate concern — flagged here
-- so it isn't forgotten.
create or replace function public.generate_topic_test (p_filters jsonb, p_question_count int, p_total_seconds int, p_already_attempted_questions boolean, p_branch_id text, p_record_activity boolean)
    returns jsonb
    language plpgsql
    security definer
    as $$
declare
    v_user_id uuid := auth.uid ();
    v_new_test_id uuid;
    v_existing_test_id uuid;
    v_actual_count int;
    v_total_marks int;
    v_topic_names text[];
    v_limit_new int := floor(p_question_count * 0.50);
    v_limit_rev int := floor(p_question_count * 0.30);
    v_limit_att int := p_question_count - (v_limit_new + v_limit_rev);
begin
    if v_user_id is null then
        raise exception 'not authenticated';
    end if;
    select
        id
    into
        v_existing_test_id
    from
        public.topic_tests
    where
        user_id = v_user_id
        and branch_id = p_branch_id
        and status != 'completed'
    limit 1;
    if v_existing_test_id is not null then
        return jsonb_build_object('error', 'an active test already exists for this branch', 'test_id', v_existing_test_id, 'status', 'active_exists');
    end if;
    select
        array_agg(distinct topic)
    into
        v_topic_names
    from
        jsonb_to_recordset(p_filters) as f (topic text);
    drop table if exists temp_selected_questions;
    create TEMP table temp_selected_questions on commit drop as
    with filter_params as (
        select
            subject_id,
            topic
        from
            jsonb_to_recordset(p_filters) as f (subject_id uuid,
                topic text)
),
user_history as (
    select distinct
        question_id
    from
        public.user_question_activity
    where
        user_id = v_user_id
),
revision_queue as (
    select
        question_id
    from
        public.user_incorrect_queue
    where
        user_id = v_user_id
        and box = 1
),
pool as (
    select
        q.id,
        q.marks,
        q.subject_id,
        q.topic,
        (uh.question_id is not null) as is_attempted,
        (rq.question_id is not null) as is_revision
from
    public.questions q
    inner join filter_params fp on q.subject_id = fp.subject_id
        and q.topic = fp.topic
    left join user_history uh on q.id = uh.question_id
        left join revision_queue rq on q.id = rq.question_id
    where
        q.verified = true
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
                        and public.user_can_access_mock (mq.mock_id)))
),
bucket_new as (
    select
        id,
        marks,
        1 as priority
    from
        pool
    where
        not is_attempted
    order by
        random()
    limit v_limit_new
),
bucket_rev as (
    select
        id,
        marks,
        2 as priority
    from
        pool
    where
        p_already_attempted_questions
        and is_revision
        and id not in (
            select
                id
            from
                bucket_new)
        order by
            random()
        limit v_limit_rev
),
bucket_att as (
    select
        id,
        marks,
        3 as priority
    from
        pool
    where
        id not in (
            select
                id
            from
                bucket_new
            union
            select
                id
            from
                bucket_rev)
            and (p_already_attempted_questions
                or not is_attempted)
        order by
            random()
        limit p_question_count
)
select
    id, marks
from (
    select
        *
    from
        bucket_new
    union all
    select
        *
    from
        bucket_rev
    union all
    select
        *
    from
        bucket_att) combined
limit p_question_count;
    get diagnostics v_actual_count = row_count;
    if v_actual_count = 0 then
        raise exception 'no questions found matching these filters';
    end if;
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, record_activity)
    values (v_user_id, v_topic_names, v_actual_count, (v_actual_count * 162), 'created', 0, p_branch_id, coalesce(p_record_activity, true))
returning
    id
into
    v_new_test_id;
insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
select
    v_new_test_id,
    id,
    row_number() over (),
    'unvisited'
from
    temp_selected_questions;
    select
        coalesce(sum(marks), 0)
    into
        v_total_marks
    from
        temp_selected_questions;
    update
        public.topic_tests
    set
        total_marks = v_total_marks
    where
        id = v_new_test_id;
    return jsonb_build_object('test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks);
end;
$$;

