begin;
select
    plan (10);
\set user_free  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set user_donor 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set subject_id '4e4e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e'
\set q_reg      '77777777-0000-0000-0000-000000000001'
\set q_mock     '77777777-0000-0000-0000-000000000002'
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'user_free', 'free@test.com'),
    (:'user_donor', 'donor@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name, version_number)
values
    (:'user_free', 'free', 'Free', 1),
    (:'user_donor', 'donor', 'Donor', 1)
on conflict (id)
    do nothing;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'user_free';
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'user_donor';
insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values
    (:'user_free', 'cs', '["gate"]'::jsonb, true),
    (:'user_donor', 'cs', '["gate"]'::jsonb, true)
on conflict
    do nothing;
-- ─── Subject ──────────────────────────────────────────────────────
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'Test', 'test-04-mock-filter', false)
on conflict (id)
    do update set
        is_universal = false,
        slug = EXCLUDED.slug;
-- ─── Mock configuration ───────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values ('mock-filter-test', 'Filter Test', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live')
on conflict (id)
    do update set
        label = EXCLUDED.label,
        branch = EXCLUDED.branch,
        starts_at = EXCLUDED.starts_at,
        duration_seconds = EXCLUDED.duration_seconds,
        attempt_min_tier = EXCLUDED.attempt_min_tier,
        post_min_tier = EXCLUDED.post_min_tier,
        status = EXCLUDED.status;
-- ─── Regular question ─────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'q_reg', 2025, 1, 'Test', :'subject_id', 'Topic A', 'multiple-choice', 'Regular?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- ─── Mock question ────────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'q_mock', 2026, 1, 'Test', :'subject_id', 'Topic B', 'multiple-choice', 'Mock?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- Associate question with mock through the new relationship table.
insert into public.mock_questions (mock_id, question_id, position)
    values ('mock-filter-test', :'q_mock', 1);
-- ─── Completed mock sessions for both users ───────────────────────
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
values
    ('c0000000-0000-0000-0000-000000000001', :'user_free', array['Filter Test'], 1, 0, 'completed', 1, 'cs', 'mock-filter-test', false),
    ('c0000000-0000-0000-0000-000000000002', :'user_donor', array['Filter Test'], 1, 0, 'completed', 1, 'cs', 'mock-filter-test', true);
insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
values
    ('c0000000-0000-0000-0000-000000000001', :'q_mock', 1, 'answered'),
    ('c0000000-0000-0000-0000-000000000002', :'q_mock', 1, 'answered');
-- ─── Incorrect queue entries ──────────────────────────────────────
insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
values
    (:'user_free', :'q_reg', 1, now(), now() - interval '1 hour'),
    (:'user_free', :'q_mock', 1, now(), now() - interval '1 hour'),
    (:'user_donor', :'q_reg', 1, now(), now() - interval '1 hour'),
    (:'user_donor', :'q_mock', 1, now(), now() - interval '1 hour');
-- ─── Tests start below ────────────────────────────────────────────
-- ═════════════════════════════════════════════════════════════════
-- get_topic_counts
-- ═════════════════════════════════════════════════════════════════
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is ((
            select
                count(*)::int
            from
                public.get_topic_counts (:'subject_id'::uuid)
            where
                topic = 'Topic B'), 0, 'free user get_topic_counts excludes mock-only topic (Topic B)');
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is ((
            select
                count(*)::int
            from
                public.get_topic_counts (:'subject_id'::uuid)
            where
                topic in ('Topic A', 'Topic B')),
            2,
            'donor get_topic_counts includes both topics');
-- ═════════════════════════════════════════════════════════════════
-- get_exam_subject_counts
-- ═════════════════════════════════════════════════════════════════
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is ((
            select
                COALESCE(sum(exam_specific_count), 0)::int
            from
                public.get_exam_subject_counts (array['GATE'])
            where
                subject_id = :'subject_id'::uuid), 1, 'free user get_exam_subject_counts (test subject) returns 1');
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is ((
            select
                COALESCE(sum(exam_specific_count), 0)::int
            from
                public.get_exam_subject_counts (array['GATE'])
            where
                subject_id = :'subject_id'::uuid), 2, 'donor get_exam_subject_counts (test subject) returns 2');
-- ═════════════════════════════════════════════════════════════════
-- get_critical_question_count
-- ═════════════════════════════════════════════════════════════════
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is (public.get_critical_question_count (array[:'subject_id']::uuid[]),
        1,
        'free user get_critical_question_count returns 1');
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is (public.get_critical_question_count (array[:'subject_id']::uuid[]),
        2,
        'donor get_critical_question_count returns 2');
-- ═════════════════════════════════════════════════════════════════
-- generate_weekly_revision_set
-- ═════════════════════════════════════════════════════════════════
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    public.generate_weekly_revision_set (array[:'subject_id']::uuid[], array['gate'], 'cs');
reset role;
select
    is ((
            select
                count(*)::int
            from
                revision_set_questions rsq
                join weekly_revision_set wrs on wrs.id = rsq.set_id
            where
                wrs.generated_for = :'user_free'
                and wrs.branch_id = 'cs'),
            1,
            'free user revision set has 1 question (non-mock only)');
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    public.generate_weekly_revision_set (array[:'subject_id']::uuid[], array['gate'], 'cs');
reset role;
select
    is ((
            select
                count(*)::int
            from
                revision_set_questions rsq
                join weekly_revision_set wrs on wrs.id = rsq.set_id
            where
                wrs.generated_for = :'user_donor'
                and wrs.branch_id = 'cs'),
            2,
            'donor revision set has 2 questions (mock + non-mock)');
-- ═════════════════════════════════════════════════════════════════
-- generate_topic_test
-- ═════════════════════════════════════════════════════════════════
reset role;
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id in (:'user_free', :'user_donor')
            and status <> 'completed');
delete from public.topic_tests
where user_id in (:'user_free', :'user_donor')
    and status <> 'completed';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    public.generate_topic_test (jsonb_build_array(jsonb_build_object('subject_id', :'subject_id'::uuid, 'topic', 'Topic A'), jsonb_build_object('subject_id', :'subject_id'::uuid, 'topic', 'Topic B')), 4, 600, true, 'cs', true);
reset role;
select
    is ((
            select
                count(*)::int
            from
                topic_tests_attempts tta
                join topic_tests tt on tt.id = tta.session_id
            where
                tt.user_id = :'user_free'
                and tt.status = 'created'),
            1,
            'free user topic test has 1 fixture question (mock excluded)');
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id = :'user_donor'
            and status <> 'completed');
delete from public.topic_tests
where user_id = :'user_donor'
    and status <> 'completed';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    public.generate_topic_test (jsonb_build_array(jsonb_build_object('subject_id', :'subject_id'::uuid, 'topic', 'Topic A'), jsonb_build_object('subject_id', :'subject_id'::uuid, 'topic', 'Topic B')), 4, 600, true, 'cs', true);
reset role;
select
    is ((
            select
                count(*)::int
            from
                topic_tests_attempts tta
                join topic_tests tt on tt.id = tta.session_id
            where
                tt.user_id = :'user_donor'
                and tt.status = 'created'),
            2,
            'donor topic test has 2 fixture questions (mock + non-mock)');
select
    *
from
    finish ();
rollback;

